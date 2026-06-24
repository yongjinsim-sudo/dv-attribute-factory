export type EnvironmentSafety = 'None' | 'Grey' | 'Amber' | 'Red';

export type AttributeFactoryEnvironmentViewModel = {
	label: string;
	url?: string;
	state: 'NotConnected' | 'Connected';
	safety: EnvironmentSafety;
	safetyLabel: string;
};

export type EntityViewModel = {
	logicalName: string;
	displayName?: string;
};

export type AttributeDataType =
	| 'Text'
	| 'MultilineText'
	| 'WholeNumber'
	| 'Decimal'
	| 'Currency'
	| 'DateOnly'
	| 'DateTime'
	| 'YesNo'
	| 'Choice'
	| 'Lookup';

export type RequirementLevel = 'None' | 'Recommended' | 'Required';

export type AttributeDefinitionOrigin = 'Manual' | 'FlatImport' | 'DvqrRich';

export type AttributeDefinitionDraft = {
	id: string;
	tableLogicalName: string;
	displayName: string;
	/** Dataverse logical name used for metadata existence checks. For new custom columns this is usually schemaName lower-cased; DVQR-rich imports may provide the exact logical name. */
	logicalName?: string;
	schemaName: string;
	type: AttributeDataType;
	required: RequirementLevel;
	description?: string;
	maxLength?: number;
	precision?: number;
	choiceValues?: string;
	lookupTarget?: string;
	relationshipSchemaName?: string;
	origin?: AttributeDefinitionOrigin;
	sourceIsValidForCreate?: boolean;
	sourceIsValidForUpdate?: boolean;
	sourceAttributeOf?: string;
	sourceProviderId?: string;
	sourceFindingId?: string;
	sourceReason?: string;
	sourceEnvironmentLabel?: string;
	targetEnvironmentLabel?: string;
	reconstructionSupportLevel?: string;
};

export type ValidationIssue = {
	draftId: string;
	severity: 'Error' | 'Warning';
	message: string;
};

export type PendingAttributeChange = {
	kind: 'CreateAttribute' | 'CreateLookupRelationship';
	draft: AttributeDefinitionDraft;
	issues: ValidationIssue[];
};

export type ExecutionResult = {
	draftId: string;
	schemaName: string;
	status: 'Created' | 'Skipped' | 'Failed';
	message: string;
};

export type AttributeFactoryViewModel = {
	productName: string;
	subtitle: string;
	environment: AttributeFactoryEnvironmentViewModel;
	entities: EntityViewModel[];
	drafts: AttributeDefinitionDraft[];
	pendingChanges: PendingAttributeChange[];
	validationIssues: ValidationIssue[];
	executionResults: ExecutionResult[];
	previewOpen: boolean;
	summary: {
		draftCount: number;
		pendingChangeCount: number;
		errorCount: number;
		warningCount: number;
	};
	message?: {
		kind: 'Info' | 'Warning' | 'Error';
		text: string;
	};
};
