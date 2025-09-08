# Refactorings 04: Incremental Plan

This plan turns the architectural blueprint in `project/refactorings-04/plan.md` into slow, safe, incremental phases. Each phase is narrowly scoped, additive-first, and ends with a STATUS update so the next phase starts with an accurate baseline.

## Principles
- Safe by default: feature flags and adapters chosen at composition points.
- Additive first: introduce new seams (ports/adapters, schemas) before swapping implementations.
- Small steps: each phase should be reviewable within ~30 minutes.
- Rollbackable: toggles and clear revert paths on risky steps.

## Phases Overview
1) Ports & Adapters Skeleton (no behavior change)
2) Config & Feature Flags (centralized, typed; still no behavior change)
3) Schemas & Migrations (App/Org JSON contracts)
4) EventService via Adapter (flagged; mocks remain default)
5) React Query Read-Only (events/org reads; keep Zustand for UI state)
6) Wizard Forms: RHF + Zod + Draft Autosave (no persistence change)
7) Blob/Registry Services Read-Only (list from blobs under flag)
8) ETag & Concurrency (write preconditions; typed errors)
9) Media Uploads Adapter Boundary (signing/pluggable provider)
10) Tests, Observability, Cleanup (CI checks, logs, docs)

Each phase has a `README.md` and a `PROMPT.md` with concrete tasks and validation steps.

See `STATUS.md` for current progress.
