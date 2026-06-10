import * as vscode from 'vscode';
import { openAttributeFactoryCommand } from './commands/openAttributeFactoryCommand';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('dvAttributeFactory.openAttributeFactory', () => openAttributeFactoryCommand(context))
	);
}

export function deactivate() {}
