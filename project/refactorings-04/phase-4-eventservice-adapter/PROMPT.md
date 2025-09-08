# Phase 4 Prompt: EventService via Adapter (Flagged; Mocks Default)

Introduce adapter selection behind a feature flag. Keep mocks as default.

Tasks:
1) Implement a mock adapter implementing `event.repo.port.ts` that returns current mock events.
2) Implement a blob-backed adapter (read-only) that reads App/Org JSON to list today’s events.
3) Create a small composition module (e.g., `src/app/providers/ports.ts`) that selects the adapter by flag.
4) Update `EventService` to delegate to the selected adapter internally. Do NOT remove existing fallback paths.
5) Add minimal logging to verify which adapter is active in dev.

Validation:
- With flag OFF: behavior identical to current app (mocks).
- With flag ON: blob adapter can list events if blobs exist.
- No regressions; `STATUS.md` to be updated after review.
