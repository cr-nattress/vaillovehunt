# Phase 6 — Testing Foundation (Unit, Integration, Contract, E2E)

Goal
- Establish a reliable test matrix to catch regressions early and keep changes safe.

Scope
- Unit tests (Vitest) for utilities, hooks, and store slices.
- Integration tests (React Testing Library) for key components.
- Contract tests around service schemas (with Zod) using mocked responses.
- E2E tests (Playwright) for top scenarios.

Out of Scope
- Full test coverage; target high-value paths first.

Implementation Steps
- Ensure `vitest` config is up-to-date (`vitest.config.ts`).
- Add unit tests:
  - `src/hooks/useProgress` happy/sad paths.
  - New hooks from earlier phases (`useCompanyEventPhotos`, etc.).
  - Store navigation slice actions/selectors.
- Add integration tests (RTL):
  - `src/features/app/StopsList.tsx` — current vs completed views.
  - `src/features/app/StopCard.tsx` — upload button enabled/disabled states.
- Add contract tests:
  - Mock service responses and validate with Zod schemas.
- Add minimal Playwright E2E suite:
  - Start with: open hunt → reveal hint → upload photo (mock) → verify completed accordion.

Acceptance Criteria
- Tests are runnable locally and in CI.
- New tests cover at least the above areas.
- A failing contract test fails CI if payloads drift.

Guardrails
- Keep mocks close to reality; avoid brittle snapshots.
- Ensure tests are deterministic and fast.
