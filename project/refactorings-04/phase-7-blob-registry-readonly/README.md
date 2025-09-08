# Phase 7: Blob/Registry Services Read‑Only (List via Blobs)

Goal: Introduce read‑only `BlobService` and `OrgRegistryService` and exercise them under a feature flag to list events from blobs without removing mocks.

Reference: `project/refactorings-04/plan.md`, `project/features-updated-data-model/NOTES.md`

## Tasks
- Add `src/services/BlobService.ts` with a readJson method (and TODO for writeJson) that calls Netlify functions or blobs.
- Add `src/services/OrgRegistryService.ts` with:
  - `loadApp()` → returns `{ data: AppJson, etag? }` (parse with Zod/migrations)
  - `loadOrg(orgSlug)` → returns `{ data: OrgJson, etag? }`
- Wire a temporary dev-only path that fetches today’s events using these services, but keep the default source as mocks.
- Add logs to clearly indicate when blob-backed path is used.

## Acceptance Criteria
- App builds and runs.
- With flag ON (dev), today’s events can be listed from blobs where data exists; with flag OFF, mocks are used.
- No persistence/writes in this phase.
- Update `project/refactorings-04/STATUS.md` after review.
