import { AttributeDefinitionDraft, AttributeFactoryEnvironmentViewModel, EntityViewModel, ExecutionResult, PendingAttributeChange, ValidationIssue } from './attributeFactoryTypes';

export type AttributeFactoryState = {
	environment: AttributeFactoryEnvironmentViewModel;
	entities: EntityViewModel[];
	drafts: AttributeDefinitionDraft[];
	pendingChanges: PendingAttributeChange[];
	validationIssues: ValidationIssue[];
	executionResults: ExecutionResult[];
	existingAttributeKeys: string[];
	previewOpen: boolean;
	message?: { kind: 'Info' | 'Warning' | 'Error'; text: string };
};

export function createInitialAttributeFactoryState(): AttributeFactoryState {
	return {
		environment: {
			label: 'Not connected',
			state: 'NotConnected',
			safety: 'None',
			safetyLabel: 'No environment selected'
		},
		entities: [],
		drafts: [],
		pendingChanges: [],
		validationIssues: [],
		executionResults: [],
		existingAttributeKeys: [],
		previewOpen: false
	};
}
