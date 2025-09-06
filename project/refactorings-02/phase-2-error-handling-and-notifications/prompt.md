# Phase 2 — Centralized Error Handling & Notifications

Goal
- Standardize error handling and user-facing notifications to avoid scattered, brittle error logic.

Scope
- Expand or introduce `NotificationService` with: `notifySuccess`, `notifyWarning`, `notifyError`.
- Add a unified error type and mapping layer in `src/utils/errors.ts` (e.g., NetworkError, ValidationError, ServiceUnavailable).
- Wrap top-level pages with `ErrorBoundary` (you have `src/features/app/ErrorBoundary.tsx`). Add a reset action.

Out of Scope
- Rewriting all features; start with critical paths (upload, feed, photos).

Implementation Steps
- Create `src/utils/errors.ts` with factory helpers and mappers.
- Ensure services catch errors and convert to unified errors, then notify appropriately.
- Add `ErrorBoundary` around hunt page content in `src/App.jsx`.
- Provide actionable messages (retry, report, open rules) and log structured details.

Acceptance Criteria
- Critical paths use the NotificationService for user-visible errors.
- ErrorBoundary prevents white screens; reset works.
- Logs include consistent tags for area and action.

Guardrails
- Keep messages friendly and concise. Do not leak stack traces to users.
