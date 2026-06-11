# DV Attribute Factory

Bulk-create Dataverse columns inside VS Code.

**DV Attribute Factory** is a focused DV ForgeLab utility for creating new Dataverse columns from staged definitions with validation, preview, execution reporting, and explicit publish semantics.

## Highlights

- Webview-based column factory experience
- CSV import and export
- JSON import and export
- CSV template generation
- Preview-first metadata mutation workflow
- Environment-aware safety indicators
- Explicit apply and publish semantics
- Existing column detection
- Duplicate definition detection and merge handling
- Validation before Dataverse mutation
- Execution reporting with Created, Skipped, and Failed outcomes
- Shared DV ForgeLab Dataverse environment settings

## Screenshot

![DV Attribute Factory](docs/dvaf-page.png)

DV Attribute Factory running inside VS Code with staged column definitions, validation status, environment-aware safety indicators, and preview-first metadata creation workflows.

## Preview-first workflow

```text
Connect
↓
Add or import column definitions
↓
Validate
↓
Preview
↓
Create attributes
↓
Review execution report
```

## Supported column types

### Supported in v1.0.0

- Text
- Multiline Text
- Whole Number
- Decimal
- Currency
- Date Only
- Date and Time
- Yes/No
- Choice

### Unsupported in v1.0.0

- Lookup

Lookup columns are not supported in v1.0.0 because Dataverse lookup creation requires relationship creation rather than standard attribute creation. DV Attribute Factory intentionally remains focused on attribute creation rather than relationship management.

## Scope

DV Attribute Factory is intentionally a factory, not an attribute manager.

Included:

- Create new Dataverse columns
- Validate staged definitions
- Import and export definitions
- Preview before Dataverse mutation
- Publish affected tables after creation
- Review execution results

Excluded:

- Modify existing columns
- Delete columns
- Change column types
- Migrate data
- Update forms
- Update views
- Dependency analysis
- Relationship creation
- Security configuration
- Automatic metadata remediation

## Boundary

DV Attribute Factory creates new Dataverse columns from staged definitions.

It does not:

- Modify existing columns
- Delete columns
- Change column types
- Migrate data
- Update forms
- Update views
- Perform dependency analysis
- Create relationships
- Manage security configuration

## Shared DV ForgeLab environment settings

```json
"dvForgeLab.environments": [
  {
    "name": "DEV",
    "url": "https://org.crm6.dynamics.com",
    "tenantId": "optional-tenant-id"
  }
]
```

## Command

```text
DV Attribute Factory: Open Attribute Factory
```

## Philosophy

DV Attribute Factory follows the DV ForgeLab preview-first invariant.

Metadata changes are staged locally, validated, previewed, and explicitly applied by the user. Dataverse metadata is never changed without an explicit preview and confirmation step.

## Future Direction

DV Attribute Factory definition files are intended to become reusable metadata reconstruction artifacts.

Future DV ForgeLab ecosystem integration may allow:

```text
DV Quick Run
    ↓
Cross-Environment Diff
    ↓
Generate DVAF Definition
    ↓
DV Attribute Factory
    ↓
Preview
    ↓
Create Attributes
```

DV Quick Run remains responsible for observing and reporting metadata drift. DV Attribute Factory remains responsible for preview-first metadata creation.

## Part of the DV ForgeLab Family

DV Attribute Factory is a focused Dataverse utility from DV ForgeLab.

For operational investigation, execution, runtime analysis, and cross-environment comparison, see [DV Quick Run](https://www.dvquickrun.com).

DV Attribute Factory follows the same principles:

* Preview-first
* Environment-aware
* Metadata-backed
* Explicit execution
* Calm operational UX

---

Built by **[DV ForgeLab](https://www.dvforgelab.com)**.