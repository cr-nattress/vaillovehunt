# Phase 9 — Zustand State Slice Hygiene

Goal
- Reduce coupling and accidental state mutations by organizing the store into clear, typed slices with pure actions and selectors.

Scope
- Define/store slices for:
  - navigation: `currentPage`, `taskTab`, actions `navigate`, `setTaskTab`
  - upload: queue/statuses (from Phase 4), actions to enqueue/update/remove
  - progress: per-stop progress with typed updates
  - settings: team, event, location with setters
- Provide memoized selectors for common reads.

Out of Scope
- New features; focus on structure and safety.

Implementation Steps
- Create slice creators (e.g., `createNavigationSlice`, `createUploadSlice`, etc.) and compose in `useAppStore`.
- Add dev-time guards: warn on invalid transitions (e.g., unknown page/tab).
- Export selectors (e.g., `selectCurrentPage`, `selectTaskTab`) to reduce re-renders.
- Add unit tests for reducers/actions and guard behavior.

Acceptance Criteria
- Store is split into logical slices, actions are pure, and selectors exist for hot paths.
- Invalid inputs do not corrupt state and log a dev warning.
- No UI breakage; same behavior as before.

Guardrails
- Keep existing public API of `useAppStore` stable where possible; add deprecations gradually.
