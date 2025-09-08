# Phase 1 Prompt: Ports & Adapters Skeleton (No Behavior Change)

Implement the clean seams as skeletons. Do NOT wire them into runtime yet.

Tasks:
1) Create `src/ports/` and add:
   - `event.repo.port.ts` with `listToday`, `getEvent`, `upsertEvent` signatures
   - `org.repo.port.ts` with `getOrg`, `upsertOrg`, `listOrgs`
   - `media.port.ts` with `uploadImage`, `uploadVideo`
2) Create `src/infra/http/`, `src/infra/storage/`, `src/infra/media/` with empty adapter stubs and TODOs.
3) Add simple `index.ts` barrels for `src/ports` and each `src/infra/*` directory.
4) Ensure TypeScript builds. Do not import these anywhere yet.

Validation:
- Build passes; no app imports changed.
- `project/refactorings-04/STATUS.md` remains unchanged until Phase 1 is reviewed.
