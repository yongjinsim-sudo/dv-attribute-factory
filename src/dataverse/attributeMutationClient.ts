import { AttributeDefinitionDraft, ExecutionResult } from '../product/attributeFactoryTypes';
import { DataverseHttpClient } from './dataverseHttpClient';
import { AttributeMetadataClient } from './attributeMetadataClient';

function buildLabel(label: string): unknown {
	return {
		LocalizedLabels: [{ Label: label, LanguageCode: 1033 }],
		UserLocalizedLabel: { Label: label, LanguageCode: 1033 }
	};
}

function buildRequirementLevel(value: string): unknown {
	const dataverseValue = value === 'Required'
		? 'ApplicationRequired'
		: value === 'Recommended'
			? 'Recommended'
			: 'None';
	return { Value: dataverseValue };
}

function buildPublishXml(entityLogicalName: string): string {
	return `<importexportxml><entities><entity>${entityLogicalName}</entity></entities></importexportxml>`;
}

function sanitiseSchemaPart(value: string | undefined): string {
	return (value ?? '')
		.trim()
		.replace(/[^A-Za-z0-9_]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '') || 'Lookup';
}

function buildRelationshipSchemaName(draft: AttributeDefinitionDraft): string {
	if (draft.relationshipSchemaName?.trim()) {
		return draft.relationshipSchemaName.trim();
	}
	const lookupSchema = sanitiseSchemaPart(draft.schemaName);
	const target = sanitiseSchemaPart(draft.lookupTarget);
	const source = sanitiseSchemaPart(draft.tableLogicalName);
	return `${target}_${source}_${lookupSchema}`;
}

function parseChoiceValues(input: string | undefined): Array<{ label: string; value?: number }> {
	return (input ?? '')
		.split(/\r?\n|;/)
		.map(item => item.trim())
		.filter(Boolean)
		.map(item => {
			const [labelPart, valuePart] = item.split('|').map(part => part.trim());
			const parsedValue = valuePart && /^\d+$/.test(valuePart) ? Number(valuePart) : undefined;
			return { label: labelPart, value: parsedValue };
		});
}

function buildAttributeMetadata(draft: AttributeDefinitionDraft): Record<string, unknown> {
	const common: Record<string, unknown> = {
		SchemaName: draft.schemaName.trim(),
		DisplayName: buildLabel(draft.displayName.trim()),
		Description: buildLabel(draft.description?.trim() || draft.displayName.trim()),
		RequiredLevel: buildRequirementLevel(draft.required)
	};

	switch (draft.type) {
		case 'Text':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', MaxLength: draft.maxLength ?? 100, FormatName: { Value: 'Text' } };
		case 'MultilineText':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata', MaxLength: draft.maxLength ?? 2000 };
		case 'WholeNumber':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata', MinValue: -2147483648, MaxValue: 2147483647 };
		case 'Decimal':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', MinValue: -100000000000, MaxValue: 100000000000, Precision: draft.precision ?? 2 };
		case 'Currency':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.MoneyAttributeMetadata', MinValue: -922337203685477, MaxValue: 922337203685477, Precision: draft.precision ?? 2 };
		case 'DateOnly':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', Format: 'DateOnly' };
		case 'DateTime':
			return { ...common, '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', Format: 'DateAndTime' };
		case 'YesNo':
			return {
				...common,
				'@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata',
				OptionSet: {
					TrueOption: { Value: 1, Label: buildLabel('Yes') },
					FalseOption: { Value: 0, Label: buildLabel('No') }
				}
			};
		case 'Choice':
			return {
				...common,
				'@odata.type': 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
				OptionSet: {
					IsGlobal: false,
					OptionSetType: 'Picklist',
					Options: parseChoiceValues(draft.choiceValues).map(option => ({ Value: option.value, Label: buildLabel(option.label) }))
				}
			};
		case 'Lookup':
			throw new Error('Lookup columns must be created through relationship metadata, not direct attribute metadata.');
		default:
			return common;
	}
}


function buildLookupRelationshipMetadata(draft: AttributeDefinitionDraft): Record<string, unknown> {
	const lookupTarget = draft.lookupTarget?.trim();
	if (!lookupTarget) {
		throw new Error('Lookup target table is required before creating relationship metadata.');
	}

	return {
		'@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
		SchemaName: buildRelationshipSchemaName(draft),
		ReferencedEntity: lookupTarget,
		ReferencingEntity: draft.tableLogicalName.trim(),
		Lookup: {
			'@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
			SchemaName: draft.schemaName.trim(),
			DisplayName: buildLabel(draft.displayName.trim()),
			Description: buildLabel(draft.description?.trim() || draft.displayName.trim()),
			RequiredLevel: buildRequirementLevel(draft.required)
		}
	};
}

export class AttributeMutationClient {
	constructor(
		private readonly client: DataverseHttpClient,
		private readonly metadataClient: AttributeMetadataClient
	) {}

	async createAttributes(drafts: AttributeDefinitionDraft[]): Promise<ExecutionResult[]> {
		const results: ExecutionResult[] = [];
		for (const draft of drafts) {
			try {
				const attributeLogicalName = (draft.logicalName || draft.schemaName).trim();
				if (await this.metadataClient.attributeExists(draft.tableLogicalName, attributeLogicalName)) {
					results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Skipped', message: 'Column already exists.' });
					continue;
				}

				if (draft.type === 'Lookup') {
					await this.client.post('/RelationshipDefinitions', buildLookupRelationshipMetadata(draft));
					results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Created', message: 'Lookup relationship and column created.' });
				} else {
					await this.client.post(`/EntityDefinitions(LogicalName='${draft.tableLogicalName}')/Attributes`, buildAttributeMetadata(draft));
					results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Created', message: 'Column created.' });
				}
			} catch (error) {
				results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Failed', message: error instanceof Error ? error.message : String(error) });
			}
		}
		return results;
	}

	async publishEntities(entityLogicalNames: string[]): Promise<void> {
		const unique = [...new Set(entityLogicalNames.map(item => item.trim()).filter(Boolean))];
		for (const entity of unique) {
			await this.client.post('/PublishXml', { ParameterXml: buildPublishXml(entity) });
		}
	}
}
