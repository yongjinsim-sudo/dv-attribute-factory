import { AttributeDefinitionDraft, EntityViewModel, PendingAttributeChange, ValidationIssue } from './attributeFactoryTypes';

const schemaNamePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function normalise(value: string): string {
	return value.trim().toLowerCase();
}

function isLookupSupportedByDvqrRichImport(draft: AttributeDefinitionDraft): boolean {
	return draft.type === 'Lookup' && draft.origin === 'DvqrRich';
}

export function validateDrafts(drafts: AttributeDefinitionDraft[], entities: EntityViewModel[], existingAttributeKeys: string[] = []): { issues: ValidationIssue[]; pendingChanges: PendingAttributeChange[] } {
	const entityNames = new Set(entities.map(entity => normalise(entity.logicalName)));
	const schemaNames = new Map<string, number>();
	const existingAttributes = new Set(existingAttributeKeys.map(value => value.toLowerCase()));
	const issues: ValidationIssue[] = [];

	for (const draft of drafts) {
		const table = draft.tableLogicalName.trim();
		const schema = draft.schemaName.trim();

		if (!table) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Table logical name is required.' });
		} else if (entityNames.size && !entityNames.has(normalise(table))) {
			issues.push({ draftId: draft.id, severity: 'Warning', message: `Table ${table} was not found in the loaded entity list.` });
		}

		if (!draft.displayName.trim()) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Display name is required.' });
		}

		if (!schema) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Schema name is required.' });
		} else if (!schemaNamePattern.test(schema)) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Schema name must start with a letter and contain only letters, numbers, and underscores.' });
		}

		const key = `${normalise(table)}::${normalise(schema)}`;
		const existingKey = `${normalise(table)}::${normalise(draft.logicalName || schema)}`;
		schemaNames.set(key, (schemaNames.get(key) ?? 0) + 1);

		if (table && schema && existingAttributes.has(existingKey)) {
			issues.push({ draftId: draft.id, severity: 'Warning', message: 'Column already exists and will be skipped.' });
		}

		if ((draft.type === 'Text' || draft.type === 'MultilineText') && draft.maxLength !== undefined) {
			if (!Number.isInteger(draft.maxLength) || draft.maxLength < 1) {
				issues.push({ draftId: draft.id, severity: 'Error', message: 'Max length must be a positive whole number.' });
			}
		}

		if (draft.type === 'Choice' && !draft.choiceValues?.trim()) {
			issues.push({ draftId: draft.id, severity: 'Warning', message: 'Choice column has no choice values. The column can be created, but the choices should be reviewed.' });
		}

		if (draft.sourceIsValidForCreate === false) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'DVQR source metadata says this column is not valid for create. Preserve for review, but do not execute.' });
		}

		if (draft.sourceAttributeOf?.trim()) {
			issues.push({ draftId: draft.id, severity: 'Warning', message: `DVQR source metadata indicates this column is attributeOf ${draft.sourceAttributeOf}. Review carefully before creating.` });
		}

		if (draft.type === 'Lookup') {
			if (!isLookupSupportedByDvqrRichImport(draft)) {
				issues.push({ draftId: draft.id, severity: 'Warning', message: 'Lookup creation requires DVQR-rich .dvaf.json metadata in v1.1.0.' });
			}
			if (!draft.lookupTarget?.trim()) {
				issues.push({ draftId: draft.id, severity: 'Error', message: 'Lookup target table is required.' });
			} else if (entityNames.size && !entityNames.has(normalise(draft.lookupTarget))) {
				issues.push({ draftId: draft.id, severity: 'Warning', message: `Lookup target ${draft.lookupTarget} was not found in the loaded entity list.` });
			}
			if (isLookupSupportedByDvqrRichImport(draft)) {
				issues.push({ draftId: draft.id, severity: 'Warning', message: 'DVQR-rich lookup import: preview carefully because Dataverse may create relationship metadata.' });
			}
		}
	}

	for (const draft of drafts) {
		const key = `${normalise(draft.tableLogicalName)}::${normalise(draft.schemaName)}`;
		if ((schemaNames.get(key) ?? 0) > 1) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Duplicate schema name for the same table in this batch.' });
		}
	}

	const pendingChanges = drafts
		.map((draft): PendingAttributeChange => ({
			kind: draft.type === 'Lookup' ? 'CreateLookupRelationship' : 'CreateAttribute',
			draft,
			issues: issues.filter(issue => issue.draftId === draft.id)
		}))
		.filter(change => !change.issues.some(issue => issue.severity === 'Error' || issue.message.includes('already exists') || issue.message.includes('requires DVQR-rich')));

	return { issues, pendingChanges };
}
