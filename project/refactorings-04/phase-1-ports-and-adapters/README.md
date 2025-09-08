# Phase 1: Ports & Adapters Skeleton (No Behavior Change)

Goal: Introduce clean seams (ports) and placeholder adapters without changing runtime behavior. This is purely additive and safe.

Reference: `project/refactorings-04/plan.md`

## Tasks
- Create a minimal `ports/` directory (interfaces only):
  - `event.repo.port.ts` — listToday, getEvent, upsertEvent (signatures only)
  - `org.repo.port.ts` — getOrg, upsertOrg, listOrgs
  - `media.port.ts` — uploadImage, uploadVideo (signatures only)
- Create matching `infra/` directories (adapters):
  - `infra/http/` — placeholder HTTP adapters (no wiring)
  - `infra/storage/` — placeholder blob/kv adapters (no wiring)
  - `infra/media/` — placeholder cloudinary adapter (no wiring)
- Export everything in index barrels for discoverability.

## Acceptance Criteria
- TypeScript compiles; no imports from these new modules in the app yet.
- No behavior change; mocks remain in use.
- `STATUS.md` updated to mark Phase 1 as completed.
