# Change Log

All notable changes to the "DV Attribute Factory" extension will be documented in this file.

## [1.1.0] - DVQR Reconstruction Artifact Import & Lookup Support

### Added

* Added support for DV Quick Run rich `.dvaf.json` reconstruction artifacts.
* Added source-side reconstruction import from `artifactKind: dvqr-dvaf-attribute-reconstruction`.
* Added lookup column validation and preview support for DVQR-rich imports when target metadata is available.
* Added DVQR source context on imported rows, including source/target environment labels, provider id, finding id, reconstruction reason, and support level.
* Added safeguards for DVQR rows marked `isValidForCreate: false`; these rows are preserved for review but blocked from execution.

### Changed

* Lookup columns are no longer globally treated as unsupported.
* Flat CSV/JSON lookup definitions remain review-only unless sufficient DVQR-rich metadata is provided.
* Preview wording now distinguishes standard attribute creation from lookup reconstruction.
* Feedback links now identify DVAF v1.1.0.
* Added relationship-based lookup creation using Dataverse RelationshipDefinitions for DVQR-rich lookup imports.
* Added DVQR-rich Choice/Picklist reconstruction support, including imported option values.
* Preserved global choice source metadata while reconstructing choices as local choice columns in v1.1.0.
* Removed automatic connection on open; DVAF now connects only when the user selects Connect.

### Boundary

DV Attribute Factory validates, previews, and creates supported metadata from DVQR reconstruction intent. DV Quick Run investigates and exports reconstruction artifacts; DVAF owns preview/apply; humans retain operational authority.

Global choice lifecycle management remains outside DVAF v1.1.0 and belongs to DV Choice Editor. DVAF may reconstruct a choice column from captured options, but it does not recreate or manage global choice definitions.

## [1.0.2] - Feedback Integration & Ecosystem Connectivity

### Added

* Added in-product Feedback action.
* Feedback now opens the DV ForgeLab feedback portal directly from DV Attribute Factory.
* Feedback links support product-aware routing using the shared DV ForgeLab feedback workflow.
* Feedback submissions automatically identify DV Attribute Factory as the source product.
* Feedback submissions now include extension version information to improve support and issue investigation.

### Changed

* Improved DV ForgeLab ecosystem connectivity.
* Strengthened product continuity between DV Attribute Factory and the broader DV ForgeLab utility family.
* Refined utility footer and ecosystem navigation references.

### Ecosystem

DV Attribute Factory now participates in the shared DV ForgeLab feedback experience alongside:

* DV Quick Run
* DV Bulk Upsert Runner
* DV Choice Editor
* DV Environment Variable Manager
* DV Identity Manager

This enables product-specific feedback collection while preserving a single feedback destination and support workflow.

## [1.0.1] - Documentation & Branding Refresh

### Changed

- Added DV ForgeLab website links across documentation.
- Updated footer links to point to dvforgelab.com and dvquickrun.com.
- Refreshed README screenshots and workflow documentation.
- Improved product ecosystem references.

## [1.0.0] - Preview-First Column Creation

### Added

- DV Attribute Factory VS Code command and branded DV ForgeLab webview.
- Shared DV ForgeLab environment connection support.
- Bulk Dataverse column creation from staged definitions.
- Preview-first validation and explicit apply/publish workflow.
- Environment-aware preview experience (DEV, SIT/UAT, PROD).
- CSV import and export.
- JSON import and export.
- CSV template generation.
- Type-aware column definition experience.
- Support for:
  - Text
  - Multiline Text
  - Whole Number
  - Decimal
  - Currency
  - Date Only
  - Date and Time
  - Yes/No
  - Choice
- Choice value definition support.
- Metadata validation before apply.
- Existing column detection.
- Duplicate definition detection and merge handling during import.
- Execution results reporting with Created, Skipped, and Failed outcomes.
- Environment safety messaging and preview summaries.
- Consistent DV ForgeLab utility experience aligned with DV Choice Editor and DV Environment Variable Manager.
- Refined preview experience to present pending metadata mutations before execution.
- Simplified utility scope around staged column creation.
- Improved import/export workflows for repeatable metadata definition management.
- Improved validation feedback and execution reporting.

### Unsupported

- Lookup columns.

Lookup columns require Dataverse relationship creation and are not treated as standard attribute creation operations in DV Attribute Factory v1.0.0.

### Boundaries

- Creates new Dataverse columns only.
- Does not modify existing columns.
- Does not delete columns.
- Does not migrate data.
- Does not update forms.
- Does not update views.
- Does not perform dependency analysis.
- Does not create relationships.
- Does not manage security configuration.
- Does not automatically remediate metadata drift.

### Philosophy

DV Attribute Factory is a preview-first metadata creation utility.

Changes are staged locally, validated, reviewed, and explicitly applied by the user. Dataverse metadata is never mutated without a preview and explicit confirmation step.

Built by DV ForgeLab.