# Phase 10: Tests, Observability, Cleanup

Goal: Solidify the refactoring with tests, logging, docs, and small cleanups. Ensure feature flags default to safe values and CI checks pass.

Reference: `project/refactorings-04/plan.md`

## Tasks
- Tests
  - Unit: ports and adapters, schema migrations, mappers
  - Integration: blob/registry read path with a mocked BlobService; EventService adapter selection
  - E2E: basic join flow + upload happy path
- Observability
  - Add structured logs in adapters (requestId, orgSlug)
  - Add Sentry breadcrumbs for key flows (join event, wizard submit)
- Cleanup
  - Remove dead code paths after verifying flags
  - Update docs: ADRs for ports/adapters and data model; README updates in features
  - Ensure flags default to conservative values
- CI
  - Lint, typecheck, unit tests in PRs; optional Playwright smoke on previews

## Acceptance Criteria
- CI pipeline passes on PRs
- Flags documented and default safe
- Minimal, useful logs for debugging
- `STATUS.md` updated as completed
