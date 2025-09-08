# Phase 4: EventService via Adapter (Flagged; Mocks Default)

Goal: Introduce adapter selection for EventService behind a feature flag, keeping mocks as the default source.

Reference: `project/refactorings-04/plan.md`

## Tasks
- Create an Event repository adapter that implements `event.repo.port.ts` using the current mock logic.
- Create a blob-backed adapter (read-only) that lists “today’s hunts” by reading App/Org JSON.
- Add a tiny composition point that picks the adapter based on a feature flag (e.g., `flags.USE_HTTP_REPO` or `flags.USE_BLOBS_REPO`).
- Keep `EventService` delegating to the selected adapter. Do not remove mocks yet.

## Acceptance Criteria
- App builds and runs; no user-visible change when flags are OFF (mocks).
- When flag is ON in dev, the blob-backed adapter can be exercised without breaking the app.
- `STATUS.md` updated after review.
