# Phase 5 — Navigation via Zustand (Non-breaking)

Goal
- Centralize navigation state in Zustand without breaking existing hash routing. Begin in mirror mode, then switch components to read from the store while still updating the hash (for shareability) until later phases remove it.

Scope
- Add/confirm a navigation slice in `useAppStore`:
  - `currentPage: 'hunt' | 'feed'`
  - `taskTab: 'current' | 'completed'`
  - actions: `navigate(page)`, `setTaskTab(tab)`
- On mount, mirror the current hash to the store; on store changes, update the hash (two-way, but store becomes source-of-truth for UI).
- Convert `Header.tsx` and `App.jsx` to use store navigation.

Out of Scope
- Deleting hash routing implementation (can be removed later once stable).

Implementation Steps
- Implement a `navigation` slice with type guards. Avoid invalid states (warn in dev).
- In `src/App.jsx`, replace `useHashRouter` usage with store selectors and actions.
- Temporary effect: when `currentPage` changes, update the hash to keep deep link parity.
- Unit-test the slice actions and initial boot sync.

Acceptance Criteria
- UI reads navigation from Zustand and behaves the same.
- Hash reflects navigation changes (so users can still share/bookmark temporarily).
- No regressions in page and tab navigation.

Guardrails
- Leave `useHashRouter.ts` in place for now; only stop importing it from UI.
- Keep changes additive and revertible.
