export const attributeFactoryStyles = `
:root {
	--dv-bg: #111314;
	--dv-surface: #1f2123;
	--dv-surface-2: #24272a;
	--dv-border: #33373b;
	--dv-border-soft: #2b2f33;
	--dv-text: #d6d6d6;
	--dv-muted: #a0a5aa;
	--dv-accent: #2f8ec3;
	--dv-accent-soft: rgba(47, 142, 195, 0.18);
	--dv-warning: #d8a93b;
	--dv-danger: #df7b69;
	--dv-success: #67c587;
}

* { box-sizing: border-box; }
body {
	margin: 0;
	padding: 24px;
	background: var(--vscode-editor-background, var(--dv-bg));
	color: var(--vscode-editor-foreground, var(--dv-text));
	font-family: var(--vscode-font-family);
	font-size: var(--vscode-font-size);
}

.dv-shell { max-width: 1440px; margin: 0 auto; }
.dv-hero {
	display: flex;
	justify-content: space-between;
	gap: 24px;
	align-items: center;
	padding: 24px;
	border: 1px solid var(--dv-border);
	border-radius: 14px;
	background: linear-gradient(135deg, rgba(37,39,42,0.98), rgba(31,33,35,0.98));
	box-shadow: 0 8px 28px rgba(0,0,0,0.18);
}
.dv-kicker {
	text-transform: uppercase;
	letter-spacing: 0.16em;
	font-size: 11px;
	color: var(--dv-muted);
	margin-bottom: 10px;
	font-weight: 700;
}
.dv-hero h1 { margin: 0; font-size: 30px; line-height: 1.15; }
.dv-hero p { margin: 10px 0 0; color: var(--dv-muted); }
.dv-logo-card {
	width: 88px;
	height: 88px;
	border: 1px solid var(--dv-border);
	border-radius: 18px;
	display: grid;
	place-items: center;
	background: rgba(0,0,0,0.22);
	flex: 0 0 auto;
}
.dv-logo-card img { width: 76px; height: 76px; object-fit: contain; }

.dv-toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin: 18px 0;
	flex-wrap: wrap;
}
.dv-status-pills, .dv-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dv-pill {
	border: 1px solid var(--dv-border);
	border-radius: 999px;
	padding: 6px 10px;
	color: var(--dv-muted);
	background: rgba(255,255,255,0.03);
	white-space: nowrap;
}
.dv-pill.info, .dv-pill.accent { color: #dff4ff; border-color: rgba(47,142,195,0.48); background: var(--dv-accent-soft); }
.dv-pill.neutral, .dv-pill.grey { color: #d6d6d6; border-color: rgba(160,165,170,0.55); background: rgba(160,165,170,0.12); }
.dv-pill.success { color: #daf8e4; border-color: rgba(103,197,135,0.55); background: rgba(103,197,135,0.13); }
.dv-pill.warning { color: #ffe6a3; border-color: rgba(216,169,59,0.55); background: rgba(216,169,59,0.13); }
.dv-pill.danger { color: #ffd8d2; border-color: rgba(223,123,105,0.55); background: rgba(223,123,105,0.13); }

button, select, input, textarea { font-family: var(--vscode-font-family); }
button {
	border: 1px solid var(--dv-border);
	border-radius: 8px;
	padding: 8px 12px;
	background: var(--dv-surface-2);
	color: var(--dv-text);
	cursor: pointer;
}
button:hover { border-color: rgba(47,142,195,0.7); }
button:not(.secondary) { background: var(--dv-accent); border-color: var(--dv-accent); color: #fff; }
button.primary { background: var(--dv-accent); border-color: var(--dv-accent); color: #fff; }
button.warning-primary { background: #b98716; border-color: #d8a93b; color: #fff; }
button.danger-primary { background: #b94c3f; border-color: #df7b69; color: #fff; }
button.secondary { background: var(--dv-surface-2); color: var(--dv-text); }
button.danger { background: #b94c3f; border-color: var(--dv-danger); color: #fff; }
button:disabled { opacity: .55; cursor: not-allowed; }

.dv-message {
	margin: 0 0 18px;
	border: 1px solid var(--dv-border);
	border-radius: 10px;
	padding: 10px 12px;
	background: rgba(255,255,255,0.035);
	color: var(--dv-muted);
}
.dv-message.Error { border-color: rgba(223,123,105,.7); color: #ffd8d2; }
.dv-message.Warning { border-color: rgba(216,169,59,.7); color: #ffe6a3; }
.dv-message.Info { border-color: rgba(47,142,195,.7); color: #dff4ff; }

.dv-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(160px, 1fr));
	gap: 12px;
	margin-bottom: 18px;
}
.dv-card {
	border: 1px solid var(--dv-border);
	border-radius: 12px;
	background: var(--dv-surface);
	padding: 16px;
}
.dv-summary { min-height: 118px; position: relative; overflow: hidden; }
.dv-summary::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: transparent; }
.dv-summary.accent-blue::before { background: var(--dv-accent); }
.dv-summary.accent-yellow::before { background: var(--dv-warning); }
.dv-summary span {
	display: block;
	color: var(--dv-muted);
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: .08em;
}
.dv-summary strong { display: block; font-size: 28px; font-weight: 700; margin-top: 8px; line-height: 1; }
.dv-summary p { margin: 10px 0 0; color: var(--dv-muted); }

.dv-section { margin-top: 18px; }
.dv-section h2 { margin: 0 0 8px; font-size: 21px; }
.dv-section h3 { margin: 0 0 8px; font-size: 14px; }
.dv-section p { margin: 0 0 14px; color: var(--dv-muted); }
.dv-section-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 12px;
}

.dv-draft-list {
	display: grid;
	gap: 12px;
}
.dv-draft-card {
	border: 1px solid var(--dv-border);
	border-radius: 12px;
	background: rgba(255,255,255,0.018);
	padding: 12px;
}
.dv-draft-card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 12px;
	padding-bottom: 10px;
	border-bottom: 1px solid var(--dv-border-soft);
}
.dv-draft-card-header strong { overflow-wrap: anywhere; }
.dv-draft-card-header p { margin: 4px 0 0; color: var(--dv-muted); }
.dv-draft-status {
	display: flex;
	align-items: flex-start;
	justify-content: flex-end;
	gap: 8px;
	flex-wrap: wrap;
	min-width: 180px;
}
.dv-draft-issues {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
	justify-content: flex-end;
}
.dv-draft-fields {
	display: grid;
	grid-template-columns: repeat(5, minmax(150px, 1fr));
	gap: 12px;
	align-items: start;
}
.dv-draft-fields label {
	display: grid;
	gap: 6px;
}
.dv-draft-fields label > span {
	color: var(--dv-muted);
	font-size: 12px;
	font-weight: 700;
}
.dv-draft-fields .span-2 {
	grid-column: span 2;
}
.dv-draft-fields em {
	color: var(--dv-muted);
	font-style: normal;
	font-size: 11px;
}
.dv-command-select {
	width: auto;
	min-width: 112px;
	background: var(--dv-surface-2);
}
select, input, textarea {
	width: 100%;
	border: 1px solid var(--dv-border);
	border-radius: 8px;
	padding: 9px 10px;
	background: var(--vscode-input-background, #151719);
	color: var(--vscode-input-foreground, var(--dv-text));
}
textarea { min-height: 54px; resize: vertical; }
.dv-description { min-height: 58px; }
.dv-choice-values {
	min-height: 96px;
	white-space: pre;
	font-family: var(--vscode-editor-font-family, monospace);
	font-size: 12px;
}
.dv-empty { padding: 34px; text-align: center; color: var(--dv-muted); }
.dv-list { display: grid; gap: 8px; }

.dv-preview-card { border-left: 4px solid var(--dv-warning); }
.dv-preview-card.grey-preview { border-left-color: var(--dv-muted); }
.dv-preview-card.warning-preview { border-left-color: var(--dv-warning); }
.dv-preview-card.danger-preview { border-left-color: var(--dv-danger); }
.dv-preview-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(140px, 1fr));
	gap: 10px;
	margin: 12px 0 16px;
}
.dv-preview-grid div, .dv-operation, .dv-result, .dv-issue {
	border: 1px solid var(--dv-border-soft);
	border-radius: 10px;
	background: rgba(255,255,255,0.025);
	padding: 12px;
}
.dv-preview-grid span { display: block; color: var(--dv-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.dv-preview-grid strong { display: block; overflow-wrap: anywhere; }
.dv-preview-grid p { margin: 6px 0 0; color: var(--dv-muted); }
.dv-preview-grid em { display: block; margin-top: 6px; color: var(--dv-muted); font-style: normal; font-size: 12px; }
.dv-preview-note { color: var(--dv-muted); border: 1px solid rgba(216,169,59,0.35); background: rgba(216,169,59,0.08); border-radius: 10px; padding: 10px 12px; margin: 14px 0; }
.dv-operation, .dv-result, .dv-issue { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.dv-operation p, .dv-result p { margin: 4px 0 0; color: var(--dv-muted); }
.dv-muted { color: var(--dv-muted); }

.dv-footer-note { margin-top: 20px; color: var(--dv-muted); font-size: 12px; }
.dv-footer-note a { color: #5ec8ff; text-decoration: underline; }
.dv-footer-note a:hover { color: #8bddff; }

@media (max-width: 900px) {
	.dv-grid, .dv-preview-grid, .dv-draft-fields { grid-template-columns: 1fr; }
	.dv-draft-fields .span-2 { grid-column: span 1; }
	.dv-section-header { flex-direction: column; }
	.dv-hero { align-items: flex-start; }
}

/* DVAF row-card refinements */
.dv-advanced-fields {
	display: flex;
	align-items: center;
	gap: 18px;
	padding-top: 22px;
	min-height: 58px;
}
.dv-checkbox-field {
	display: inline-flex !important;
	grid-template-columns: auto auto !important;
	align-items: center;
	gap: 8px !important;
	white-space: nowrap;
	color: var(--dv-muted);
	font-weight: 700;
}
.dv-checkbox-field input[type="checkbox"] {
	width: auto;
	margin: 0;
}
.dv-bottom-actions {
	border-top: 1px solid var(--dv-border-soft);
	margin-top: 14px;
	padding-top: 14px;
	display: flex;
	justify-content: flex-end;
}


/* Choice values modal */
.dv-modal-backdrop {
	position: fixed;
	inset: 0;
	z-index: 1000;
	background: rgba(0,0,0,0.55);
	display: grid;
	place-items: center;
	padding: 24px;
}
.dv-modal-backdrop.hidden { display: none; }
.dv-modal {
	width: min(720px, 100%);
	border: 1px solid var(--dv-border);
	border-radius: 14px;
	background: var(--dv-surface);
	box-shadow: 0 18px 48px rgba(0,0,0,0.38);
	padding: 16px;
}
.dv-modal-header {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: flex-start;
	margin-bottom: 12px;
}
.dv-modal-header h2 { margin: 0 0 6px; }
.dv-modal-header p { margin: 0; color: var(--dv-muted); }
.dv-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 12px;
}
.dv-modal .dv-choice-values {
	min-height: 220px;
}


.dv-source-note { border: 1px solid rgba(92, 179, 255, 0.28); background: rgba(92, 179, 255, 0.08); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.dv-source-note strong { color: var(--dv-text); font-size: 12px; }
.dv-source-note span, .dv-source-note em { color: var(--dv-muted); font-size: 12px; }

`;
