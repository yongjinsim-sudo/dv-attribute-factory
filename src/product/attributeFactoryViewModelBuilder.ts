import { AttributeFactoryState } from './attributeFactoryState';
import { AttributeFactoryViewModel, EnvironmentSafety } from './attributeFactoryTypes';

function classifyEnvironment(label: string, url?: string): { safety: EnvironmentSafety; safetyLabel: string } {
	const source = `${label} ${url ?? ''}`.toLowerCase();
	if (!url) {
		return { safety: 'None', safetyLabel: 'No environment selected' };
	}
	if (/\b(prod|production|prd)\b/.test(source)) {
		return { safety: 'Red', safetyLabel: 'Production-class environment' };
	}
	if (/\b(uat|sit|test|preprod|pre-prod|stage|staging)\b/.test(source)) {
		return { safety: 'Amber', safetyLabel: 'Controlled non-production environment' };
	}
	return { safety: 'Grey', safetyLabel: 'Development / unclassified environment' };
}

export function buildAttributeFactoryViewModel(state: AttributeFactoryState): AttributeFactoryViewModel {
	const environmentSafety = classifyEnvironment(state.environment.label, state.environment.url);
	const errorCount = state.validationIssues.filter(issue => issue.severity === 'Error').length;
	const warningCount = state.validationIssues.filter(issue => issue.severity === 'Warning').length;

	return {
		productName: 'DV Attribute Factory',
		subtitle: 'Bulk-create Dataverse columns from definitions with preview-first validation.',
		environment: {
			...state.environment,
			...environmentSafety
		},
		entities: state.entities,
		drafts: state.drafts,
		pendingChanges: state.pendingChanges,
		validationIssues: state.validationIssues,
		executionResults: state.executionResults,
		previewOpen: state.previewOpen,
		summary: {
			draftCount: state.drafts.length,
			pendingChangeCount: state.pendingChanges.length,
			errorCount,
			warningCount
		},
		message: state.message
	};
}
