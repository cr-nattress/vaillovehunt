# Phase 5: React Query Read‑Only (Events/Org Reads)

Goal: Introduce React Query for server state (events/org reads) without removing existing Zustand UI state or changing sources. Keep behavior identical; only add read‑only queries.

Reference: `project/refactorings-04/plan.md`

## Tasks
- Add a QueryClient provider at app root if not already present.
- Create queries for:
  - Today’s events list (wrap existing `EventService.fetchTodaysEvents` call)
  - Org JSON read (placeholder hook that won’t be used yet in UI)
- Keep all UI using existing props/state; just prove query isolation and cache keys.
- Document cache keys and invalidation plan.

## Acceptance Criteria
- App builds and behaves the same; queries run behind the scenes.
- No UI wiring to the queries yet (or do a single, trivial read in Splash without changing rendering).
- `STATUS.md` updated after review.
