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
			return {
				...common,
				'@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
				Targets: [draft.lookupTarget?.trim()].filter(Boolean)
			};
		default:
			return common;
	}
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
				if (await this.metadataClient.attributeExists(draft.tableLogicalName, draft.schemaName)) {
					results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Skipped', message: 'Column already exists.' });
					continue;
				}

				await this.client.post(`/EntityDefinitions(LogicalName='${draft.tableLogicalName}')/Attributes`, buildAttributeMetadata(draft));
				results.push({ draftId: draft.id, schemaName: draft.schemaName, status: 'Created', message: 'Column created.' });
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
