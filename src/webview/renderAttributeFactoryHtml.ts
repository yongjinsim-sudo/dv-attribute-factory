import { escapeHtml } from '../shared/escaping';
import { AttributeDataType, AttributeDefinitionDraft, AttributeFactoryViewModel, RequirementLevel } from '../product/attributeFactoryTypes';
import { attributeFactoryScript } from './attributeFactoryScript';
import { attributeFactoryStyles } from './attributeFactoryStyles';

type RenderOptions = { logoUri: string; cspSource: string };

const attributeTypes: AttributeDataType[] = ['Text', 'MultilineText', 'WholeNumber', 'Decimal', 'Currency', 'DateOnly', 'DateTime', 'YesNo', 'Choice', 'Lookup'];
const requirementLevels: RequirementLevel[] = ['None', 'Recommended', 'Required'];

function option(value: string, selected?: string): string {
	return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`;
}

function input(draft: AttributeDefinitionDraft, field: keyof AttributeDefinitionDraft, value: unknown, extra = ''): string {
	return `<input ${extra} value="${escapeHtml(String(value ?? ''))}" data-command="updateDraft" data-id="${escapeHtml(draft.id)}" data-field="${escapeHtml(String(field))}">`;
}

function getOptionLabel(value: string): string {
	return value === 'Lookup' ? 'Lookup (planned)' : value;
}

function select(draft: AttributeDefinitionDraft, field: keyof AttributeDefinitionDraft, values: string[], selected: string): string {
	return `<select data-command="updateDraft" data-id="${escapeHtml(draft.id)}" data-field="${escapeHtml(String(field))}">${values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(getOptionLabel(value))}</option>`).join('')}</select>`;
}

function getEnvironmentPillClass(viewModel: AttributeFactoryViewModel): string {
	if (viewModel.environment.safety === 'Red') {
		return 'danger';
	}

	if (viewModel.environment.safety === 'Amber') {
		return 'warning';
	}

	if (viewModel.environment.safety === 'Grey') {
		return 'grey';
	}

	return 'accent';
}

function getApplyButtonClass(viewModel: AttributeFactoryViewModel): string {
	if (viewModel.environment.safety === 'Red') {
		return 'danger-primary';
	}

	if (viewModel.environment.safety === 'Amber') {
		return 'warning-primary';
	}

	return 'primary';
}

function getPreviewCardClass(viewModel: AttributeFactoryViewModel): string {
	if (viewModel.environment.safety === 'Red') {
		return 'danger-preview';
	}

	if (viewModel.environment.safety === 'Amber') {
		return 'warning-preview';
	}

	return 'grey-preview';
}

function getApplyWarningText(viewModel: AttributeFactoryViewModel): string {
	if (viewModel.environment.safety === 'Red') {
		return 'Production-class environment detected. Review carefully before applying and publishing metadata changes.';
	}

	if (viewModel.environment.safety === 'Amber') {
		return 'Controlled non-production environment detected. Review staged changes before applying and publishing.';
	}

	return 'These changes are still staged locally. Dataverse metadata will only be changed when you choose Apply and publish.';
}

function shouldShowMaxLength(type: AttributeDataType): boolean {
	return type === 'Text' || type === 'MultilineText';
}

function shouldShowPrecision(type: AttributeDataType): boolean {
	return type === 'Decimal' || type === 'Currency';
}

function formatTypeSummary(draft: AttributeDefinitionDraft): string {
	if ((draft.type === 'Text' || draft.type === 'MultilineText') && draft.maxLength) {
		return `${draft.type}(${draft.maxLength})`;
	}
	if ((draft.type === 'Decimal' || draft.type === 'Currency') && draft.precision !== undefined) {
		return `${draft.type} • precision ${draft.precision}`;
	}
	if (draft.type === 'Choice') {
		const count = (draft.choiceValues ?? '').split(/\r?\n|;/).map(item => item.trim()).filter(Boolean).length;
		return count ? `Choice • ${count} value(s)` : 'Choice';
	}
	if (draft.type === 'Lookup') {
		return draft.lookupTarget ? `Lookup → ${draft.lookupTarget} (planned)` : 'Lookup (planned)';
	}
	return draft.type;
}

function renderDraftRow(draft: AttributeDefinitionDraft, viewModel: AttributeFactoryViewModel): string {
	const issues = viewModel.validationIssues.filter(issue => issue.draftId === draft.id);
	const issueHtml = issues.length
		? `<div class="dv-draft-issues">${issues.map(issue => `<span class="dv-pill ${issue.severity === 'Error' ? 'danger' : 'warning'}">${escapeHtml(issue.message)}</span>`).join('')}</div>`
		: '<span class="dv-pill success">Valid</span>';
	const maxLengthHtml = shouldShowMaxLength(draft.type)
		? `<label><span>Max length</span>${input(draft, 'maxLength', draft.maxLength ?? '', 'inputmode="numeric" pattern="[0-9]*" placeholder="100"')}</label>`
		: '';
	const precisionHtml = shouldShowPrecision(draft.type)
		? `<label><span>Precision</span>${input(draft, 'precision', draft.precision ?? '', 'inputmode="numeric" pattern="[0-9]*" placeholder="2"')}</label>`
		: '';
	const choiceValueCount = (draft.choiceValues ?? '').split(/\r?\n|;/).map(item => item.trim()).filter(Boolean).length;
	const choiceHtml = draft.type === 'Choice'
		? `<label><span>Choice values</span><button type="button" class="secondary" data-command="editChoiceValues" data-id="${escapeHtml(draft.id)}" data-value="${escapeHtml(draft.choiceValues ?? '')}">Edit choice values${choiceValueCount ? ` (${choiceValueCount})` : ''}</button><em>Use Label|Value pairs separated by semicolons or new lines.</em></label>`
		: '';
	const lookupHtml = draft.type === 'Lookup'
		? `<label><span>Lookup target</span>${input(draft, 'lookupTarget', draft.lookupTarget ?? '', 'list="dvaf-entities" placeholder="contact"')}<em>Unsupported in v1.0.0: lookup columns require relationship creation.</em></label>`
		: '';
	return `<div class="dv-draft-card">
		<div class="dv-draft-card-header">
			<div><strong>${escapeHtml(draft.tableLogicalName || 'New table')}.${escapeHtml(draft.schemaName || 'new_column')}</strong><p>${escapeHtml(draft.displayName || 'New column')} • ${escapeHtml(formatTypeSummary(draft))}</p></div>
			<div class="dv-draft-status">${issueHtml}<button class="secondary" data-command="removeDraft" data-id="${escapeHtml(draft.id)}">Remove</button></div>
		</div>
		<div class="dv-draft-fields">
			<label><span>Table</span>${input(draft, 'tableLogicalName', draft.tableLogicalName, 'list="dvaf-entities" placeholder="account"')}</label>
			<label><span>Display name</span>${input(draft, 'displayName', draft.displayName, 'placeholder="External ID"')}</label>
			<label><span>Schema name</span>${input(draft, 'schemaName', draft.schemaName, 'placeholder="new_externalid"')}</label>
			<label><span>Type</span>${select(draft, 'type', attributeTypes, draft.type)}</label>
			<label><span>Required</span>${select(draft, 'required', requirementLevels, draft.required)}</label>
			${maxLengthHtml}
			${precisionHtml}
			${lookupHtml}
			${choiceHtml}
			<label class="span-2"><span>Description</span><textarea class="dv-description" data-command="updateDraft" data-id="${escapeHtml(draft.id)}" data-field="description">${escapeHtml(draft.description ?? '')}</textarea></label>
		</div>
	</div>`;
}
function renderPreview(viewModel: AttributeFactoryViewModel): string {
	if (!viewModel.previewOpen) {
		return '';
	}
	const hasErrors = viewModel.summary.errorCount > 0;
	const previewCardClass = getPreviewCardClass(viewModel);
	const applyButtonClass = getApplyButtonClass(viewModel);
	const applyWarningText = getApplyWarningText(viewModel);
	return `<section class="dv-card dv-section dv-preview-card ${previewCardClass}">
		<div class="dv-section-header">
			<div><div class="dv-kicker">Metadata update preview</div><h2>Preview column creation</h2><p>Review staged metadata mutations before applying them to Dataverse.</p></div>
			<span class="dv-pill warning">Preview-first</span>
		</div>
		<div class="dv-preview-grid">
			<div><span>Environment</span><strong>${escapeHtml(viewModel.environment.label)}</strong><em>${escapeHtml(viewModel.environment.safetyLabel)}</em></div>
			<div><span>Pending creates</span><strong>${escapeHtml(viewModel.pendingChanges.length)}</strong><em>${escapeHtml(viewModel.summary.errorCount)} error(s), ${escapeHtml(viewModel.summary.warningCount)} warning(s)</em></div>
			<div><span>Mutation</span><strong>CreateAttribute + PublishXml</strong><em>Only after explicit apply.</em></div>
		</div>
		<div class="dv-list">
			${viewModel.pendingChanges.map(change => `<div class="dv-operation"><div><strong>${escapeHtml(change.draft.tableLogicalName)}.${escapeHtml(change.draft.schemaName)}</strong><p>${escapeHtml(change.draft.displayName)} • ${escapeHtml(formatTypeSummary(change.draft))}</p></div><span class="dv-pill ${change.issues.some(issue => issue.severity === 'Error') ? 'danger' : change.issues.length ? 'warning' : 'success'}">${change.issues.length ? `${change.issues.length} issue(s)` : 'Ready'}</span></div>`).join('') || '<div class="dv-empty">No staged definitions.</div>'}
		</div>
		<div class="dv-preview-note">${escapeHtml(applyWarningText)}</div>
		<div class="dv-actions" style="margin-top:12px">
			<button class="secondary" data-command="cancelPreview">Cancel preview</button>
			<button class="${applyButtonClass}" ${hasErrors || !viewModel.pendingChanges.length ? 'disabled' : ''} data-command="applyAndPublish">Create ${escapeHtml(viewModel.pendingChanges.length)} Attributes</button>
		</div>
	</section>`;
}

function renderResults(viewModel: AttributeFactoryViewModel): string {
	if (!viewModel.executionResults.length) {
		return '';
	}
	return `<section class="dv-card dv-section"><h2>Execution results</h2><div class="dv-list">${viewModel.executionResults.map(result => `<div class="dv-result"><div><strong>${escapeHtml(result.schemaName)}</strong><p>${escapeHtml(result.message)}</p></div><span class="dv-pill ${result.status === 'Created' ? 'success' : result.status === 'Failed' ? 'danger' : 'warning'}">${escapeHtml(result.status)}</span></div>`).join('')}</div></section>`;
}

export function renderAttributeFactoryHtml(viewModel: AttributeFactoryViewModel, options: RenderOptions): string {
	const messageHtml = viewModel.message ? `<div class="dv-message ${escapeHtml(viewModel.message.kind)}">${escapeHtml(viewModel.message.text)}</div>` : '';
	const environmentPillClass = getEnvironmentPillClass(viewModel);
	const environmentPillText = viewModel.environment.label === 'Not connected' ? 'No environment connected' : viewModel.environment.label;
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${options.cspSource}; style-src ${options.cspSource} 'unsafe-inline'; script-src ${options.cspSource} 'unsafe-inline';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${attributeFactoryStyles}</style><title>${escapeHtml(viewModel.productName)}</title></head>
	<body><div class="dv-shell">
		<header class="dv-hero">
			<div>
				<div class="dv-kicker">DV FORGELAB UTILITY</div>
				<h1>${escapeHtml(viewModel.productName)}</h1>
				<p>${escapeHtml(viewModel.subtitle)}</p>
			</div>
			<div class="dv-logo-card"><img src="${options.logoUri}" alt="DV ForgeLab"></div>
		</header>
		<section class="dv-toolbar" aria-label="Environment and actions">
			<div class="dv-status-pills">
				<span class="dv-pill ${environmentPillClass}">${escapeHtml(environmentPillText)}</span>
				<span class="dv-pill">Preview-first</span>
				<span class="dv-pill">Factory</span>
			</div>
			<div class="dv-actions">
				<button data-command="connect">Connect</button>
				<button class="secondary" data-command="switchEnvironment">Change environment</button>
				<button class="secondary" data-command="validate">Refresh</button>
				<button class="secondary" data-command="openFeedback">Feedback</button>
			</div>
		</section>
		${messageHtml}
		<section class="dv-grid">
			<div class="dv-card dv-summary accent-blue"><span>DEFINITIONS</span><strong>${escapeHtml(viewModel.summary.draftCount)}</strong><p>Staged column definitions</p></div>
			<div class="dv-card dv-summary"><span>VALID</span><strong>${escapeHtml(Math.max(0, viewModel.summary.draftCount - viewModel.summary.errorCount))}</strong><p>Ready or warning-only rows</p></div>
			<div class="dv-card dv-summary accent-yellow"><span>ISSUES</span><strong>${escapeHtml(viewModel.summary.errorCount + viewModel.summary.warningCount)}</strong><p>Review before creation</p></div>
			<div class="dv-card dv-summary"><span>PENDING</span><strong>${escapeHtml(viewModel.summary.pendingChangeCount)}</strong><p>Before explicit apply</p></div>
		</section>
		<section class="dv-card dv-section">
			<div class="dv-section-header"><div><h2>Column definitions</h2><p>Add rows directly or import CSV / JSON definitions. Changes stay local until preview and explicit apply.</p></div><div class="dv-actions"><button data-command="addDraft">+ Add column</button><select class="dv-command-select" data-command-select="import"><option value="">Import...</option><option value="importCsv">CSV</option><option value="importJson">JSON</option></select><select class="dv-command-select" data-command-select="export"><option value="">Export...</option><option value="exportCsv">CSV</option><option value="exportJson">JSON</option></select><button class="secondary" data-command="validate">Validate</button><button class="secondary" data-command="clearDrafts">Clear</button><button ${viewModel.drafts.length ? '' : 'disabled'} data-command="openPreview">Preview</button></div></div>
			<datalist id="dvaf-entities">${viewModel.entities.map(entity => `<option value="${escapeHtml(entity.logicalName)}">${escapeHtml(entity.displayName ?? entity.logicalName)}</option>`).join('')}</datalist>
			<div class="dv-draft-list">${viewModel.drafts.length ? viewModel.drafts.map(draft => renderDraftRow(draft, viewModel)).join('') : '<div class="dv-empty">Add a column definition or import a CSV / JSON file to begin.</div>'}</div>
			<div class="dv-bottom-actions"><button data-command="addDraft">+ Add column</button></div>
		</section>
		${renderPreview(viewModel)}
		${renderResults(viewModel)}
		<section class="dv-card dv-section"><h2>Boundary</h2><p>Factory, not manager. DV Attribute Factory creates new columns from staged definitions. It does not modify existing columns, delete columns, migrate data, update forms/views, or perform dependency analysis.</p></section>
		<footer class="dv-footer-note">
			DV Attribute Factory is part of the <a href="https://www.dvforgelab.com">DV ForgeLab</a> Dataverse tooling ecosystem.
			<a href="https://www.dvquickrun.com">DV Quick Run</a> is the flagship Dataverse investigation workbench.
		</footer>
	</div><script>${attributeFactoryScript}</script></body></html>`;
}
