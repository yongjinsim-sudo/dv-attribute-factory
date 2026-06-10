export const attributeFactoryScript = String.raw`
(function () {
	const vscode = acquireVsCodeApi();
	function post(command, payload) { vscode.postMessage({ command, payload: payload || {} }); }

	function ensureChoiceDialog() {
		let dialog = document.getElementById('dv-choice-dialog');
		if (dialog) { return dialog; }
		dialog = document.createElement('div');
		dialog.id = 'dv-choice-dialog';
		dialog.className = 'dv-modal-backdrop hidden';
		dialog.innerHTML = '<div class="dv-modal"><div class="dv-modal-header"><div><div class="dv-kicker">Choice values</div><h2>Edit choice values</h2><p>Use one value per line or Label|Value pairs.</p></div><button class="secondary" data-choice-close="true">Close</button></div><textarea id="dv-choice-dialog-value" class="dv-choice-values"></textarea><div class="dv-modal-actions"><button class="secondary" data-choice-close="true">Cancel</button><button data-choice-save="true">Save choice values</button></div></div>';
		document.body.appendChild(dialog);
		return dialog;
	}

	document.addEventListener('click', function (event) {
		const target = event.target;
		if (!target || !target.dataset) { return; }
		if (target.dataset.choiceClose) {
			ensureChoiceDialog().classList.add('hidden');
			return;
		}
		if (target.dataset.choiceSave) {
			const dialog = ensureChoiceDialog();
			const textarea = document.getElementById('dv-choice-dialog-value');
			post('updateDraft', { id: dialog.dataset.id, field: 'choiceValues', value: textarea ? textarea.value : '' });
			dialog.classList.add('hidden');
			return;
		}
		if (target.dataset.command === 'editChoiceValues') {
			const dialog = ensureChoiceDialog();
			const textarea = document.getElementById('dv-choice-dialog-value');
			dialog.dataset.id = target.dataset.id || '';
			if (textarea) { textarea.value = target.dataset.value || ''; textarea.focus(); }
			dialog.classList.remove('hidden');
			return;
		}
		if (!target.dataset.command) { return; }
		if (target.tagName !== 'BUTTON') { return; }
		post(target.dataset.command, Object.assign({}, target.dataset));
	});
	document.addEventListener('change', function (event) {
		const target = event.target;
		if (!target || !target.dataset) { return; }
		if (target.dataset.commandSelect) {
			const command = target.value;
			if (command) { post(command, {}); }
			target.value = '';
			return;
		}
		if (target.dataset.command !== 'updateDraft') { return; }
		const value = target.type === 'checkbox' ? target.checked : target.value;
		post('updateDraft', { id: target.dataset.id, field: target.dataset.field, value: value });
	});
	document.addEventListener('focusout', function (event) {
		const target = event.target;
		if (!target || !target.dataset || target.dataset.command !== 'updateDraft') { return; }
		if (target.tagName === 'SELECT' || target.type === 'checkbox') { return; }
		post('updateDraft', { id: target.dataset.id, field: target.dataset.field, value: target.value });
	});
}());
`;
