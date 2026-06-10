import { AttributeDefinitionDraft, EntityViewModel, PendingAttributeChange, ValidationIssue } from './attributeFactoryTypes';

const schemaNamePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function normalise(value: string): string {
	return value.trim().toLowerCase();
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
		schemaNames.set(key, (schemaNames.get(key) ?? 0) + 1);

		if (table && schema && existingAttributes.has(key)) {
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

		if (draft.type === 'Lookup') {
			issues.push({ draftId: draft.id, severity: 'Warning', message: 'Unsupported in v1.0.0: lookup columns require relationship creation.' });
		}
	}

	for (const draft of drafts) {
		const key = `${normalise(draft.tableLogicalName)}::${normalise(draft.schemaName)}`;
		if ((schemaNames.get(key) ?? 0) > 1) {
			issues.push({ draftId: draft.id, severity: 'Error', message: 'Duplicate schema name for the same table in this batch.' });
		}
	}

	const pendingChanges = drafts
		.map(draft => ({
			kind: 'CreateAttribute' as const,
			draft,
			issues: issues.filter(issue => issue.draftId === draft.id)
		}))
		.filter(change => !change.issues.some(issue => issue.severity === 'Error' || issue.message.includes('already exists') || issue.message.includes('Unsupported in v1.0.0')));

	return { issues, pendingChanges };
}
