import * as vscode from 'vscode';
import { getAzureCliAccessToken } from './azureCliAuth';
import { DataverseHttpClient } from './dataverseHttpClient';

export type EnvironmentProfile = {
	name: string;
	url: string;
	tenantId?: string;
};

export type DataverseConnection = {
	environmentLabel: string;
	baseUrl: string;
	environmentUrl: string;
	accessToken: string;
	client: DataverseHttpClient;
};

const activeEnvironmentKey = 'dvAttributeFactory.activeEnvironment';
const sharedConfigurationSection = 'dvForgeLab';
const legacyConfigurationSection = 'dvAttributeFactory';

function normalizeEnvironmentUrl(input: string): string {
	return input
		.trim()
		.replace(/\/api\/data\/v9\.2\/?$/i, '')
		.replace(/\/+$/, '');
}

function isValidEnvironmentUrl(input: string): boolean {
	return /^https:\/\/[^/]+$/i.test(input.trim());
}

function getConfiguredEnvironments(): EnvironmentProfile[] {
	const sharedConfig = vscode.workspace.getConfiguration(sharedConfigurationSection);
	const sharedEnvironments = sharedConfig.get<EnvironmentProfile[]>('environments') ?? [];

	if (sharedEnvironments.length) {
		return sharedEnvironments;
	}

	const legacyConfig = vscode.workspace.getConfiguration(legacyConfigurationSection);
	return legacyConfig.get<EnvironmentProfile[]>('environments') ?? [];
}

async function saveConfiguredEnvironment(profile: EnvironmentProfile): Promise<void> {
	const sharedConfig = vscode.workspace.getConfiguration(sharedConfigurationSection);
	const existing = getConfiguredEnvironments();
	const updated = [
		...existing.filter(item => item.name.toLowerCase() !== profile.name.toLowerCase()),
		profile
	];

	await sharedConfig.update('environments', updated, vscode.ConfigurationTarget.Global);
}

async function createEnvironmentProfile(): Promise<EnvironmentProfile | undefined> {
	const name = await vscode.window.showInputBox({
		prompt: 'Enter environment name',
		placeHolder: 'DEV',
		ignoreFocusOut: true,
		validateInput: (value: string) => value.trim() ? undefined : 'Environment name is required.'
	});

	if (!name) {
		return undefined;
	}

	const rawUrl = await vscode.window.showInputBox({
		prompt: 'Enter Dataverse environment URL',
		placeHolder: 'https://org.crm6.dynamics.com',
		ignoreFocusOut: true,
		validateInput: (value: string) => {
			const normalized = normalizeEnvironmentUrl(value);
			if (!value.trim()) {
				return 'Environment URL is required.';
			}

			return isValidEnvironmentUrl(normalized) ? undefined : 'Enter a valid Dataverse URL like https://org.crm6.dynamics.com';
		}
	});

	if (!rawUrl) {
		return undefined;
	}

	const tenantId = await vscode.window.showInputBox({
		prompt: 'Optional tenant ID',
		placeHolder: 'Leave blank unless your Azure CLI account needs a specific tenant',
		ignoreFocusOut: true
	});

	const profile: EnvironmentProfile = {
		name: name.trim(),
		url: normalizeEnvironmentUrl(rawUrl),
		tenantId: tenantId?.trim() || undefined
	};

	await saveConfiguredEnvironment(profile);
	return profile;
}

async function pickEnvironment(context: vscode.ExtensionContext, forcePick: boolean): Promise<EnvironmentProfile | undefined> {
	let environments = getConfiguredEnvironments();

	if (!environments.length) {
		const choice = await vscode.window.showInformationMessage(
			'DV ForgeLab: No shared Dataverse environments configured yet.',
			'Set Up Environment',
			'Cancel'
		);

		if (choice !== 'Set Up Environment') {
			return undefined;
		}

		const created = await createEnvironmentProfile();
		if (!created) {
			return undefined;
		}

		environments = [created];
	}

	const savedName = context.workspaceState.get<string>(activeEnvironmentKey);
	const saved = savedName ? environments.find(item => item.name === savedName) : undefined;

	if (saved && !forcePick) {
		return saved;
	}

	const quickPickItems = [
		...environments.map(env => ({
			label: env.name,
			description: env.url,
			env
		})),
		{
			label: '$(plus) Add environment',
			description: 'Create a new Dataverse environment profile',
			env: undefined
		}
	];

	if (environments.length === 1 && !forcePick) {
		return environments[0];
	}

	const picked = await vscode.window.showQuickPick(
		quickPickItems,
		{
			placeHolder: 'Select Dataverse environment',
			ignoreFocusOut: true
		}
	);

	if (!picked) {
		return undefined;
	}

	if (!picked.env) {
		return createEnvironmentProfile();
	}

	return picked.env;
}

export async function getDataverseConnection(
	context: vscode.ExtensionContext,
	options: { forcePick?: boolean } = {}
): Promise<DataverseConnection | undefined> {
	const profile = await pickEnvironment(context, options.forcePick ?? false);
	if (!profile) {
		return undefined;
	}

	await context.workspaceState.update(activeEnvironmentKey, profile.name);

	const scope = `${profile.url}/.default`;
	const accessToken = await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `DV Attribute Factory: Connecting to ${profile.name}`,
			cancellable: false
		},
		() => getAzureCliAccessToken(scope, profile.tenantId)
	);

	const baseUrl = `${profile.url}/api/data/v9.2`;
	return {
		environmentLabel: profile.name,
		environmentUrl: profile.url,
		baseUrl,
		accessToken,
		client: new DataverseHttpClient(baseUrl, accessToken)
	};
}
