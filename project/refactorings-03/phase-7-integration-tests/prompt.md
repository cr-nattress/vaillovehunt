# Phase 7 — Small Integration Tests (RTL)

Goal
- Add a few high-signal integration tests to catch regressions from earlier phases.

Scope
- Test current vs completed rendering paths in `StopsList`.
- Test `StopCard` behaviors: upload CTA enabled/disabled, hint reveal progression, expand/collapse of completed card.
- Test CompletedAccordion quick actions render (View/Share available when completed).

Out of Scope
- Full E2E; keep these as focused RTL integration tests.

Implementation Steps
- Configure RTL test setup if needed (see `test/setup.ts`).
- Add tests under `src/features/app/__tests__/`:
  - `StopsList.integration.test.tsx`
  - `StopCard.integration.test.tsx`
  - `CompletedAccordion.integration.test.tsx`
- Mock services (PhotoUploadService) and timers for upload/transition feedback.

Acceptance Criteria
- Tests run and pass locally and in CI.
- Failures occur if upload CTA disappears, hint reveal breaks, or completed quick actions are missing.

Guardrails
- Keep tests deterministic and avoid network calls.
- Use minimal realistic mocks; avoid brittle snapshots.
