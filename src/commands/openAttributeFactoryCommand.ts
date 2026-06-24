import * as vscode from 'vscode';
import { AttributeMetadataClient } from '../dataverse/attributeMetadataClient';
import { AttributeMutationClient } from '../dataverse/attributeMutationClient';
import { DataverseConnection, getDataverseConnection } from '../dataverse/dataverseConnection';
import { createInitialAttributeFactoryState } from '../product/attributeFactoryState';
import { AttributeDataType, AttributeDefinitionDraft, RequirementLevel } from '../product/attributeFactoryTypes';
import { validateDrafts } from '../product/attributeFactoryValidation';
import { buildAttributeFactoryViewModel } from '../product/attributeFactoryViewModelBuilder';
import { renderAttributeFactoryHtml } from '../webview/renderAttributeFactoryHtml';

const panelTitle = 'DV Attribute Factory';
const commandName = 'DV Attribute Factory';
const feedbackUrl = 'https://dvforgelab.com/feedback?product=dvaf&version=1.1.0';

type WebviewMessage = {
	command?: string;
	payload?: Record<string, unknown>;
};

function createDraft(partial: Partial<AttributeDefinitionDraft> = {}): AttributeDefinitionDraft {
	return {
		id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
		tableLogicalName: String(partial.tableLogicalName ?? ''),
		displayName: String(partial.displayName ?? ''),
		logicalName: String(partial.logicalName ?? ''),
		schemaName: String(partial.schemaName ?? ''),
		type: (partial.type ?? 'Text') as AttributeDataType,
		required: (partial.required ?? 'None') as RequirementLevel,
		description: partial.description ?? '',
		maxLength: partial.maxLength ?? 100,
		precision: partial.precision ?? 2,
		choiceValues: partial.choiceValues ?? '',
		lookupTarget: partial.lookupTarget ?? '',
		relationshipSchemaName: partial.relationshipSchemaName ?? '',
		origin: partial.origin ?? 'Manual',
		sourceIsValidForCreate: partial.sourceIsValidForCreate,
		sourceIsValidForUpdate: partial.sourceIsValidForUpdate,
		sourceAttributeOf: partial.sourceAttributeOf ?? '',
		sourceProviderId: partial.sourceProviderId ?? '',
		sourceFindingId: partial.sourceFindingId ?? '',
		sourceReason: partial.sourceReason ?? '',
		sourceEnvironmentLabel: partial.sourceEnvironmentLabel ?? '',
		targetEnvironmentLabel: partial.targetEnvironmentLabel ?? '',
		reconstructionSupportLevel: partial.reconstructionSupportLevel ?? '',
	};
}

function normaliseString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function parseNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const numberValue = Number(value);
	return Number.isFinite(numberValue) ? numberValue : undefined;
}


function toCsvValue(value: unknown): string {
	const text = String(value ?? '');
	if (/[",\r\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function draftToCsvRow(draft: AttributeDefinitionDraft): string {
	return [
		draft.tableLogicalName,
		draft.displayName,
		draft.schemaName,
		draft.type,
		draft.required,
		draft.maxLength ?? '',
		draft.precision ?? '',
		draft.description ?? '',
		draft.choiceValues ?? '',
		draft.lookupTarget ?? ''
	].map(toCsvValue).join(',');
}

function buildCsvContent(drafts: AttributeDefinitionDraft[]): string {
	const header = 'Table,DisplayName,SchemaName,Type,Required,MaxLength,Precision,Description,ChoiceValues,LookupTarget';
	if (!drafts.length) {
		return `${header}\naccount,External ID,new_externalid,Text,None,100,,External system identifier,,,true,false\naccount,Customer Tier,new_customertier,Choice,None,,,Customer segmentation tier,"Gold|100000000;Silver|100000001",,true,false\n`;
	}
	return `${header}\n${drafts.map(draftToCsvRow).join('\n')}\n`;
}


function draftKey(draft: AttributeDefinitionDraft): string {
	return `${draft.tableLogicalName.trim().toLowerCase()}::${(draft.logicalName || draft.schemaName).trim().toLowerCase()}`;
}

function addImportedDrafts(existing: AttributeDefinitionDraft[], imported: AttributeDefinitionDraft[]): { added: number; updated: number; skipped: number } {
	const indexByKey = new Map(existing.map((draft, index) => [draftKey(draft), index]));
	let added = 0;
	let updated = 0;
	let skipped = 0;
	for (const draft of imported) {
		const key = draftKey(draft);
		if (key === '::') {
			skipped += 1;
			continue;
		}
		const existingIndex = indexByKey.get(key);
		if (existingIndex !== undefined) {
			existing[existingIndex] = { ...draft, id: existing[existingIndex].id };
			updated += 1;
			continue;
		}
		existing.push(draft);
		indexByKey.set(key, existing.length - 1);
		added += 1;
	}
	return { added, updated, skipped };
}


function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toAttributeDataType(value: unknown): AttributeDataType {
	const raw = normaliseString(value).toLowerCase();
	switch (raw) {
		case 'string':
		case 'text':
			return 'Text';
		case 'memo':
		case 'multilinetext':
		case 'multiline text':
			return 'MultilineText';
		case 'integer':
		case 'wholenumber':
		case 'whole number':
			return 'WholeNumber';
		case 'decimal':
			return 'Decimal';
		case 'money':
		case 'currency':
			return 'Currency';
		case 'datetime':
		case 'dateandtime':
		case 'date and time':
			return 'DateTime';
		case 'dateonly':
		case 'date only':
			return 'DateOnly';
		case 'boolean':
		case 'yesno':
		case 'yes/no':
			return 'YesNo';
		case 'picklist':
		case 'choice':
			return 'Choice';
		case 'lookup':
		case 'customer':
		case 'owner':
			return 'Lookup';
		default:
			return (normaliseString(value) || 'Text') as AttributeDataType;
	}
}

function normaliseRequired(value: unknown): RequirementLevel {
	const raw = normaliseString(value).toLowerCase();
	if (raw === 'applicationrequired' || raw === 'required') { return 'Required'; }
	if (raw === 'recommended') { return 'Recommended'; }
	return 'None';
}

function labelFromDefinition(definition: Record<string, unknown>, fallback: string): string {
	const direct = normaliseString(definition.displayName ?? definition.DisplayName);
	if (direct) { return direct; }
	const label = asRecord(asRecord(asRecord(definition.DisplayName).UserLocalizedLabel).Label);
	return normaliseString(label) || fallback;
}

function firstString(values: unknown[]): string {
	for (const value of values) {
		if (Array.isArray(value)) {
			const nested = firstString(value);
			if (nested) { return nested; }
			continue;
		}
		const text = normaliseString(value);
		if (text) { return text; }
	}
	return '';
}

function importDvqrRichJson(root: Record<string, unknown>): AttributeDefinitionDraft[] {
	if (normaliseString(root.artifactKind) !== 'dvqr-dvaf-attribute-reconstruction' || normaliseString(root.templateKind) !== 'dvqr-rich-dvaf-json') {
		return [];
	}
	const attributes = Array.isArray(root.attributes) ? root.attributes : [];
	return attributes.map(entryValue => {
		const entry = asRecord(entryValue);
		const candidate = asRecord(entry.candidate);
		const sourceDefinition = asRecord(entry.sourceDefinition);
		const compatible = asRecord(entry.dvafCompatibleDefinition);
		const lookupHint = asRecord(entry.lookupHint);
		const support = asRecord(entry.reconstructionSupport);
		const logicalName = normaliseString(sourceDefinition.logicalName ?? sourceDefinition.LogicalName ?? candidate.attributeLogicalName ?? compatible.schemaName);
		const schemaName = normaliseString(sourceDefinition.schemaName ?? sourceDefinition.SchemaName ?? compatible.schemaName ?? logicalName);
		const type = toAttributeDataType(sourceDefinition.attributeType ?? sourceDefinition.AttributeType ?? compatible.type);
		const target = firstString([
			lookupHint.targetEntityLogicalName,
			lookupHint.targetTableLogicalName,
			lookupHint.lookupTarget,
			sourceDefinition.lookupTarget,
			sourceDefinition.Targets,
			compatible.lookupTarget
		]);
		return createDraft({
			tableLogicalName: normaliseString(candidate.entityLogicalName ?? root.entityLogicalName ?? compatible.tableLogicalName),
			displayName: normaliseString(sourceDefinition.displayName ?? compatible.displayName) || schemaName || logicalName,
			logicalName,
			schemaName: schemaName || logicalName,
			type,
			required: normaliseRequired(sourceDefinition.requiredLevel ?? compatible.required),
			description: normaliseString(sourceDefinition.description ?? compatible.description),
			maxLength: parseNumber(sourceDefinition.maxLength ?? sourceDefinition.MaxLength ?? compatible.maxLength),
			precision: parseNumber(sourceDefinition.precision ?? sourceDefinition.Precision ?? compatible.precision),
			choiceValues: normaliseString(compatible.choiceValues),
			lookupTarget: target,
			relationshipSchemaName: normaliseString(lookupHint.relationshipSchemaName ?? sourceDefinition.relationshipSchemaName),
			origin: 'DvqrRich',
			sourceIsValidForCreate: typeof sourceDefinition.isValidForCreate === 'boolean' ? sourceDefinition.isValidForCreate : undefined,
			sourceIsValidForUpdate: typeof sourceDefinition.isValidForUpdate === 'boolean' ? sourceDefinition.isValidForUpdate : undefined,
			sourceAttributeOf: normaliseString(sourceDefinition.attributeOf),
			sourceProviderId: normaliseString(candidate.providerId),
			sourceFindingId: normaliseString(candidate.findingId),
			sourceReason: normaliseString(candidate.reason),
			sourceEnvironmentLabel: normaliseString(candidate.sourceEnvironmentLabel ?? root.sourceEnvironmentLabel),
			targetEnvironmentLabel: normaliseString(candidate.targetEnvironmentLabel ?? root.targetEnvironmentLabel),
			reconstructionSupportLevel: normaliseString(support.level)
		});
	});
}

function buildJsonContent(drafts: AttributeDefinitionDraft[]): string {
	const payload = drafts.length ? drafts : [
		createDraft({ tableLogicalName: 'account', displayName: 'External ID', schemaName: 'new_externalid', type: 'Text', required: 'None', maxLength: 100, description: 'External system identifier' }),
		createDraft({ tableLogicalName: 'account', displayName: 'Customer Tier', schemaName: 'new_customertier', type: 'Choice', required: 'None', description: 'Customer segmentation tier', choiceValues: 'Gold|100000000;Silver|100000001' })
	];
	return `${JSON.stringify(payload.map(({ id: _id, ...draft }) => draft), null, 2)}\n`;
}

function importJson(content: string): AttributeDefinitionDraft[] {
	const parsed = JSON.parse(content) as unknown;
	const root = asRecord(parsed);
	const richDrafts = importDvqrRichJson(root);
	if (richDrafts.length) {
		return richDrafts;
	}
	const rows = Array.isArray(parsed) ? parsed : [];
	return rows.map(row => {
		const item = row && typeof row === 'object' ? row as Record<string, unknown> : {};
		return createDraft({
			tableLogicalName: normaliseString(item.tableLogicalName ?? item.table),
			displayName: normaliseString(item.displayName),
			schemaName: normaliseString(item.schemaName),
			type: toAttributeDataType(item.type),
			required: normaliseRequired(item.required),
			description: normaliseString(item.description),
			maxLength: parseNumber(item.maxLength),
			precision: parseNumber(item.precision),
			choiceValues: normaliseString(item.choiceValues),
			lookupTarget: normaliseString(item.lookupTarget),
			origin: 'FlatImport'
		});
	});
}

function toAttributeKey(tableLogicalName: string, attributeLogicalName: string): string {
	return `${tableLogicalName.trim().toLowerCase()}::${attributeLogicalName.trim().toLowerCase()}`;
}

function updateValidation(state: ReturnType<typeof createInitialAttributeFactoryState>): void {
	const result = validateDrafts(state.drafts, state.entities, state.existingAttributeKeys);
	state.validationIssues = result.issues;
	state.pendingChanges = result.pendingChanges;
}

function parseCsvRecords(content: string): string[][] {
	const records: string[][] = [];
	let record: string[] = [];
	let current = '';
	let quoted = false;
	for (let index = 0; index < content.length; index += 1) {
		const character = content[index];
		if (character === '"') {
			if (quoted && content[index + 1] === '"') {
				current += '"';
				index += 1;
			} else {
				quoted = !quoted;
			}
			continue;
		}
		if (character === ',' && !quoted) {
			record.push(current.trim());
			current = '';
			continue;
		}
		if ((character === '\n' || character === '\r') && !quoted) {
			if (character === '\r' && content[index + 1] === '\n') {
				index += 1;
			}
			record.push(current.trim());
			current = '';
			if (record.some(value => value.length > 0)) {
				records.push(record);
			}
			record = [];
			continue;
		}
		current += character;
	}
	record.push(current.trim());
	if (record.some(value => value.length > 0)) {
		records.push(record);
	}
	return records;
}

function importCsv(content: string): AttributeDefinitionDraft[] {
	const records = parseCsvRecords(content);
	if (records.length < 2) {
		return [];
	}
	const headers = records[0].map(header => header.toLowerCase().replace(/\s+/g, ''));
	return records.slice(1).map(values => {
		const row = new Map(headers.map((header, index) => [header, values[index] ?? '']));
		return createDraft({
			tableLogicalName: row.get('table') ?? row.get('tablelogicalname') ?? '',
			displayName: row.get('displayname') ?? '',
			schemaName: row.get('schemaname') ?? '',
			type: (row.get('type') || 'Text') as AttributeDataType,
			required: (row.get('required') || 'None') as RequirementLevel,
			description: row.get('description') ?? '',
			maxLength: parseNumber(row.get('maxlength')),
			precision: parseNumber(row.get('precision')),
			choiceValues: row.get('choicevalues') ?? '',
			lookupTarget: row.get('lookuptarget') ?? '',
			origin: 'FlatImport'
		});
	});
}

export async function openAttributeFactoryCommand(context: vscode.ExtensionContext): Promise<void> {
	let connection: DataverseConnection | undefined;
	let metadataClient: AttributeMetadataClient | undefined;
	let mutationClient: AttributeMutationClient | undefined;
	const state = createInitialAttributeFactoryState();

	const panel = vscode.window.createWebviewPanel('dvAttributeFactory', panelTitle, vscode.ViewColumn.One, {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'images')]
	});
	const logoUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'images', 'dv-utilities-icon-128.png'));


	async function refreshExistingAttributeKeys(): Promise<void> {
		if (!metadataClient) {
			state.existingAttributeKeys = [];
			return;
		}
		const checkedKeys = new Set<string>();
		const existingKeys: string[] = [];
		for (const draft of state.drafts) {
			const table = draft.tableLogicalName.trim();
			const schema = draft.schemaName.trim();
			const logicalName = (draft.logicalName || draft.schemaName).trim();
			if (!table || !logicalName) {
				continue;
			}
			const key = toAttributeKey(table, logicalName);
			if (checkedKeys.has(key)) {
				continue;
			}
			checkedKeys.add(key);
			try {
				if (await metadataClient.attributeExists(table, logicalName)) {
					existingKeys.push(key);
				}
			} catch {
				// Leave validation to the apply step if metadata lookup is unavailable for this row.
			}
		}
		state.existingAttributeKeys = existingKeys;
	}

	function render(): void {
		panel.webview.html = renderAttributeFactoryHtml(buildAttributeFactoryViewModel(state), {
			logoUri: logoUri.toString(),
			cspSource: panel.webview.cspSource
		});
	}

	async function connect(forcePick = false): Promise<void> {
		try {
			state.message = { kind: 'Info', text: 'Connecting to Dataverse...' };
			render();
			connection = await getDataverseConnection(context, { forcePick });
			if (!connection) {
				state.message = { kind: 'Warning', text: 'Connection cancelled.' };
				render();
				return;
			}
			metadataClient = new AttributeMetadataClient(connection.client);
			mutationClient = new AttributeMutationClient(connection.client, metadataClient);
			state.environment = { label: connection.environmentLabel, url: connection.environmentUrl, state: 'Connected', safety: 'Grey', safetyLabel: 'Connected' };
			state.entities = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `${commandName}: Loading Dataverse tables`, cancellable: false }, () => metadataClient!.listEntities());
			await refreshExistingAttributeKeys();
			updateValidation(state);
			state.message = { kind: 'Info', text: `Connected to ${connection.environmentLabel}. ${state.entities.length} table(s) loaded.` };
			render();
		} catch (error) {
			state.message = { kind: 'Error', text: error instanceof Error ? error.message : String(error) };
			render();
		}
	}

	async function importCsvFromFile(): Promise<void> {
		const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { CSV: ['csv'] }, openLabel: 'Import CSV' });
		if (!picked?.[0]) {
			return;
		}
		const bytes = await vscode.workspace.fs.readFile(picked[0]);
		const content = Buffer.from(bytes).toString('utf8');
		const imported = importCsv(content);
		const result = addImportedDrafts(state.drafts, imported);
		state.executionResults = [];
		state.previewOpen = false;
		await refreshExistingAttributeKeys();
		updateValidation(state);
		state.message = { kind: 'Info', text: `${result.added} attribute definition(s) imported from CSV. ${result.updated} existing row(s) updated. ${result.skipped} invalid row(s) skipped.` };
		render();
	}

async function importJsonFromFile(): Promise<void> {
		const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json'] }, openLabel: 'Import JSON' });
		if (!picked?.[0]) {
			return;
		}
		const bytes = await vscode.workspace.fs.readFile(picked[0]);
		const content = Buffer.from(bytes).toString('utf8');
		const imported = importJson(content);
		const result = addImportedDrafts(state.drafts, imported);
		state.executionResults = [];
		state.previewOpen = false;
		await refreshExistingAttributeKeys();
		updateValidation(state);
		state.message = { kind: 'Info', text: `${result.added} attribute definition(s) imported from JSON. ${result.updated} existing row(s) updated. ${result.skipped} invalid row(s) skipped.` };
		render();
	}

	async function exportJson(): Promise<void> {
		const hasDrafts = state.drafts.length > 0;
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(hasDrafts ? 'dv-attribute-factory-definitions.json' : 'dv-attribute-factory-template.json'),
			filters: { JSON: ['json'] },
			saveLabel: hasDrafts ? 'Export Definitions' : 'Save Template'
		});
		if (!uri) {
			return;
		}
		await vscode.workspace.fs.writeFile(uri, Buffer.from(buildJsonContent(state.drafts), 'utf8'));
		state.message = { kind: 'Info', text: hasDrafts ? `${state.drafts.length} staged definition(s) exported to JSON.` : 'JSON template exported.' };
		render();
	}

		async function exportCsv(): Promise<void> {
		const hasDrafts = state.drafts.length > 0;
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(hasDrafts ? 'dv-attribute-factory-definitions.csv' : 'dv-attribute-factory-template.csv'),
			filters: { CSV: ['csv'] },
			saveLabel: hasDrafts ? 'Export Definitions' : 'Save Template'
		});
		if (!uri) {
			return;
		}
		await vscode.workspace.fs.writeFile(uri, Buffer.from(buildCsvContent(state.drafts), 'utf8'));
		state.message = { kind: 'Info', text: hasDrafts ? `${state.drafts.length} staged definition(s) exported to CSV.` : 'CSV template exported.' };
		render();
	}

	async function applyAndPublish(): Promise<void> {
		if (!mutationClient) {
			state.message = { kind: 'Warning', text: 'Connect to Dataverse before applying changes.' };
			render();
			return;
		}
		await refreshExistingAttributeKeys();
		updateValidation(state);
		if (state.validationIssues.some(issue => issue.severity === 'Error')) {
			state.message = { kind: 'Error', text: 'Resolve validation errors before applying changes.' };
			render();
			return;
		}
		const confirmed = await vscode.window.showWarningMessage(
			`Apply ${state.drafts.length} staged column definition(s) to ${state.environment.label} and publish affected tables?`,
			{ modal: true },
			'Apply and Publish'
		);
		if (confirmed !== 'Apply and Publish') {
			return;
		}
		state.message = { kind: 'Info', text: 'Creating Dataverse columns...' };
		render();
		const draftsToCreate = state.pendingChanges.map(change => change.draft);
		const skippedResults = state.drafts
			.filter(draft => !draftsToCreate.some(item => item.id === draft.id))
			.map(draft => {
				const draftIssues = state.validationIssues.filter(issue => issue.draftId === draft.id);
				const reason = draftIssues.find(issue => issue.message.includes('unsupported') || issue.message.includes('requires DVQR-rich'))?.message
					?? draftIssues.find(issue => issue.message.includes('already exists'))?.message
					?? 'Skipped by validation.';
				return { draftId: draft.id, schemaName: draft.schemaName, status: 'Skipped' as const, message: reason };
			});
		state.executionResults = [...await mutationClient.createAttributes(draftsToCreate), ...skippedResults];
		const createdTables = state.executionResults
			.filter(result => result.status === 'Created')
			.map(result => state.drafts.find(draft => draft.id === result.draftId)?.tableLogicalName ?? '')
			.filter(Boolean);
		await mutationClient.publishEntities(createdTables);
		state.previewOpen = false;
		state.message = { kind: 'Info', text: `${state.executionResults.filter(item => item.status === 'Created').length} column(s) created. ${state.executionResults.filter(item => item.status === 'Failed').length} failed.` };
		render();
	}

	panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
		try {
			switch (message.command) {
				case 'connect':
					await connect(false);
					break;
				case 'switchEnvironment':
					await connect(true);
					break;
				case 'addDraft':
					state.drafts.push(createDraft());
					state.executionResults = [];
					updateValidation(state);
					render();
					break;
				case 'updateDraft': {
					const id = normaliseString(message.payload?.id);
					const field = normaliseString(message.payload?.field) as keyof AttributeDefinitionDraft;
					const draft = state.drafts.find(item => item.id === id);
					if (draft && field) {
						const rawValue = message.payload?.value;
						if (field === 'maxLength' || field === 'precision') {
							(draft[field] as number | undefined) = parseNumber(rawValue);
						} else {
							(draft[field] as string) = String(rawValue ?? '');
						}
						state.executionResults = [];
						updateValidation(state);
						render();
					}
					break;
				}
				case 'removeDraft':
					state.drafts = state.drafts.filter(draft => draft.id !== normaliseString(message.payload?.id));
					state.executionResults = [];
					updateValidation(state);
					render();
					break;
				case 'importCsv':
					await importCsvFromFile();
					break;
				case 'importJson':
					await importJsonFromFile();
					break;
				case 'exportCsv':
					await exportCsv();
					break;
				case 'exportJson':
					await exportJson();
					break;
				case 'validate':
					await refreshExistingAttributeKeys();
					updateValidation(state);
					state.message = { kind: state.validationIssues.some(issue => issue.severity === 'Error') ? 'Error' : 'Info', text: `${state.validationIssues.length} validation issue(s) found.` };
					render();
					break;
				case 'openPreview':
					await refreshExistingAttributeKeys();
					updateValidation(state);
					state.previewOpen = true;
					render();
					break;
				case 'cancelPreview':
					state.previewOpen = false;
					render();
					break;
				case 'applyAndPublish':
					await applyAndPublish();
					break;
				case 'openFeedback':
					await vscode.env.openExternal(vscode.Uri.parse(feedbackUrl));
					break;
				case 'clearDrafts':
					state.drafts = [];
					state.executionResults = [];
					state.previewOpen = false;
					updateValidation(state);
					render();
					break;
			}
		} catch (error) {
			state.message = { kind: 'Error', text: error instanceof Error ? error.message : String(error) };
			render();
		}
	});

	render();
}
