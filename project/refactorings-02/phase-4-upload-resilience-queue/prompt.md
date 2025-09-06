# Phase 4 — Upload Resilience (Queue, Idempotency, Retries)

Goal
- Make photo uploads resilient to flaky networks using a local queue, idempotent operations, and exponential backoff.

Scope
- New module: `src/features/upload/UploadQueue.ts` (in-memory first; optional IndexedDB later).
- Add retry with exponential backoff and jitter for `PhotoUploadService` calls.
- Ensure idempotency by stable keys: `sessionId + stopId` to avoid duplicates.
- User feedback for states: queued, uploading, retrying, failed, done.

Out of Scope
- Persisting the queue beyond a session (optional stretch).

Implementation Steps
- Create `UploadQueue` with enqueue, processNext, markFailed, markDone.
- Wrap `PhotoUploadService.uploadPhotoWithResize` so it uses the queue.
- Add a backoff utility (e.g., base 500ms, factor 1.8, max 10s, random jitter).
- Update UI via a `usePhotoUpload` hook to expose status and actions (retry/cancel).
- Keep current UX/functionality; this is additive resilience.

Acceptance Criteria
- Uploads auto-retry on transient failures and eventually surface a clear error.
- Duplicate uploads for the same (sessionId, stopId) are avoided.
- The app remains functional if the server is down; queued items persist in memory.

Guardrails
- Do not remove the existing success path; only wrap with queue and retries.
- Keep error messages user-friendly and concise.
