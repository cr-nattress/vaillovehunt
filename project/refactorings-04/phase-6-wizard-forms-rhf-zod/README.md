# Phase 6: Wizard Forms — React Hook Form + Zod + Draft Autosave (No Persistence Change)

Goal: Harden the New Adventure wizard UX with robust form handling and validation. Keep persistence behavior unchanged (local-only handoff).

Reference: `project/refactorings-04/plan.md`, `project/features-new-adventure/README.md`

## Tasks
- Introduce React Hook Form (RHF) in the wizard steps (`new-org`, `new-hunt`, `new-steps`).
- Add Zod schemas per step and connect via `@hookform/resolvers/zod`.
- Implement field arrays for steps/hints in `new-steps`.
- Add draft autosave to IndexedDB (e.g., `idb-keyval`) every N seconds or on blur.
- Provide a "Restore draft?" prompt when reopening the wizard.
- Ensure accessible validation messages and `aria-invalid` on fields.

## Acceptance Criteria
- Users can navigate back/forward without losing inputs.
- Validation blocks Next until required fields are valid.
- Drafts persist across reloads; users can discard or restore.
- No changes to persistence or data sources yet.
