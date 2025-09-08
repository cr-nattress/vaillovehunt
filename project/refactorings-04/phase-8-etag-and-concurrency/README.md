# Phase 8: ETag & Concurrency (Write Preconditions)

Goal: Add optimistic concurrency controls for blob/KV writes using ETag (or updatedAt) preconditions and typed error handling. Keep user experience resilient (roll back optimistic UI and show a refresh prompt).

Reference: `project/refactorings-04/plan.md`

## Tasks
- Extend `src/services/BlobService.ts` with `writeJson<T>(key, data, expectedEtag?)`.
  - Return new `etag` on success.
  - Throw a typed `ConcurrencyError` on precondition failure.
- Update `src/services/OrgRegistryService.ts` writes to pass `expectedEtag` and bubble typed errors.
- Add a small error type module (e.g., `src/lib/errors.ts`) defining `ConcurrencyError`, `NetworkError`, `ValidationError`.
- Document retry/rollback strategy for UI mutations (React Query recommended pattern).

## Acceptance Criteria
- Concurrency errors are thrown as typed errors and can be detected by UI.
- No UI behavior change yet unless you opt-in in a single, trivial path.
- `STATUS.md` updated after review.
