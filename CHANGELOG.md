# Change Log

All notable changes to the "DV Attribute Factory" extension will be documented in this file.

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