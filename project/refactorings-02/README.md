# Refactorings 02 — Reliability Hardening Track

This track incrementally hardens the app to reduce brittleness during change. Each phase includes a prompt with Goals, Scope, Implementation Steps, Acceptance Criteria, and Guardrails. Execute phases sequentially. When a phase is finished and verified, rename the folder to append `-completed`.

Phases
- Phase 1 — API Contracts & Runtime Validation (Zod)
- Phase 2 — Centralized Error Handling & Notifications
- Phase 3 — Data Fetching via React Query
- Phase 4 — Upload Resilience (Queue, Idempotency, Retries)
- Phase 5 — Navigation via Zustand (Hash decoupling, non-breaking)
- Phase 6 — Testing Foundation (Unit, Integration, Contract, E2E)
- Phase 7 — Observability & CI (Logs, Sentry, CI checks)
- Phase 8 — Configuration & Env Validation
- Phase 9 — Zustand State Slice Hygiene
- Phase 10 — Storybook Component Hardening

Conventions
- Do not break existing functionality. Favor additive, opt-in changes with feature flags when risky.
- Each phase should leave the app runnable and passing tests.
- Use `-completed` suffix after finishing a phase.

Primary code areas
- Services: `src/client/*`, `src/services/*`
- State: `src/store/appStore.ts`
- App container: `src/App.jsx`
- UI features: `src/features/app/*`
- Tests & tooling: `vitest`, `playwright`, CI
