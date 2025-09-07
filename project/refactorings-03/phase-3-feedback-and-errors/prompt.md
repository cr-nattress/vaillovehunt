# Phase 3 — Feedback & Errors (Toasts + Inline Retry)

Goal
- Provide clear, consistent feedback for success/failure states and enable easy retry for uploads.

Scope
- Use `NotificationService` (or add one) for success/error toasts.
- In `stop-card/StopCardActions.tsx`, show inline error with a "Retry upload" button when upload fails.
- On success, show toast and trigger the existing completion transition.

Out of Scope
- Upload queue or idempotency; those are in refactorings-02 track.

Implementation Steps
- Wrap `onUpload` in a small error-handling layer that catches and surfaces errors (without changing the API).
- Show a spinner and "Uploading…" label during operation; disable button.
- On error, show inline message + Retry; on success, show toast and reset error states.

Acceptance Criteria
- Users always see a toast for successful uploads and a helpful message when failures occur.
- Retry is one tap and works without losing context.
- No regressions to existing transitions or completed-state behavior.

Guardrails
- Keep short messages; do not leak technical error details to users.
- Maintain accessibility via `aria-live` for toast region.
