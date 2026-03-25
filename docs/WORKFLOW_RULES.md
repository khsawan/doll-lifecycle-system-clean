# Workflow Rules

## Usage Rule

This document must be:

- read before any structural/system change
- updated whenever system behavior or architecture changes

This document is the long-term source of truth for how the Doll Lifecycle System is built, changed, and validated.

## Core Development Method

- Use a checklist-first approach.
- Work one step at a time.
- Validate each step before moving forward.
- Avoid large unverified changes.
- Break work into small, reviewable, low-risk increments whenever possible.

## Codex Interaction Rules

- Before implementing, read `docs/DOLL_LIFECYCLE_SYSTEM.md`.
- Before implementing, read `docs/WORKFLOW_RULES.md`.
- After implementing, update `docs/DOLL_LIFECYCLE_SYSTEM.md` if any system behavior changed.
- Codex must not break existing functionality.
- All changes must be live-safe.
- Changes should be localized to the smallest responsible area.
- Avoid large refactors unless explicitly requested.
- Preserve existing working behavior unless the requested change intentionally modifies it.

## Validation Rules

- Manual testing is required for key features.
- Use a `Yes` or `No` checklist format when validating important workflow behavior.
- Verify behavior before proceeding to the next step.
- If something could not be validated, it must be stated clearly.
- No important workflow change should be treated as complete without verification.

## System Consistency Rules

- `pipeline_state` is the source of truth for production progression.
- Readiness is separate from progression.
- CRM must remain separate from production logic.
- Gateway depends on digital readiness plus `commerce_status`.
- Commercial status does not replace order status, and order status does not replace product readiness.

## UI Rules

- No duplicated information.
- Clear hierarchy.
- Compact over verbose.
- Workflow over forms.
- Identity-first design.
- The pipeline should remain the main control surface for operational progression.

## Documentation Rule

This rule is critical.

- Any time we modify pipeline logic, readiness logic, stage meaning, UI workflow structure, or architecture, `docs/DOLL_LIFECYCLE_SYSTEM.md` must also be updated.
- Documentation updates are part of the implementation, not a follow-up task.
- The repository documentation is the long-term source of truth and must stay aligned with the live system.

## Safety Rules

- No breaking changes to the live system.
- Preserve backward compatibility whenever possible.
- Normalize legacy data safely.
- Prefer additive and reversible changes over risky rewrites.
- If legacy or malformed records are encountered, handle them through safe normalization rather than destructive assumptions.
