# Phase 6 — Cleanup, Docs, and Guardrails

Goal
- Remove obsolete hash routing artifacts, document the new navigation approach, and add guardrails to prevent regressions.

Scope
- Delete `src/hooks/useHashRouter.ts` and related imports.
- Remove any dead code, comments, or TODOs referencing hashes.
- Add documentation to the codebase and project README(s) explaining store-based navigation.
- Add lightweight type guards and dev warnings for invalid navigation inputs.

Out of Scope
- New features or URL strategies.

Implementation Steps
- Remove the file and update imports. Ensure build passes.
- Add a section to `project/features-remove-hash-routing/README.md` about store navigation.
- Add runtime checks in the store `navigate`/`setTaskTab` actions to warn on invalid values (dev only).

Acceptance Criteria
- No references to hash routing remain in the repo.
- Clear docs exist for the navigation approach.
- Invalid navigation values log a dev warning and do not crash the app.

References
- `src/hooks/useHashRouter.ts`
- `src/store/appStore.ts`
- `src/App.jsx`
