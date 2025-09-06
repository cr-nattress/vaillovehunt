# Phase 1 — Add Navigation Slice to Store (Mirror Mode)

Goal
- Introduce a `navigation` slice in the existing Zustand store to mirror the current hash page (`'hunt' | 'feed'`) and any tab (e.g., `'current' | 'completed'`). This phase is non-breaking and runs alongside the existing hash router.

Scope
- Add types and state: `currentPage`, `taskTab`, and an action `navigate(page)` and `setTaskTab(tab)`.
- On app mount, read the current hash via `useHashRouter` and initialize the store to match.
- Subscribe to hash changes and keep the store in sync (one-way mirror from hash → store).

Out of Scope
- Removing `useHashRouter` consumers; that is Phase 2.

Implementation Steps
- Update `src/store/appStore.ts` (or the file exporting `useAppStore`) to include a `navigation` slice:
  - `currentPage: 'hunt'` as default
  - `taskTab: 'current'` as default
  - `navigate(page: 'hunt' | 'feed')`
  - `setTaskTab(tab: 'current' | 'completed')`
- In `src/App.jsx`, after reading `useHashRouter`, set store navigation accordingly.
- Add a `useEffect` to mirror hash changes into the store.

Acceptance Criteria
- Store reflects the active page and tab at all times.
- No behavior changes for users; hash routing still controls navigation.

References
- `src/hooks/useHashRouter.ts`
- `src/store/appStore.ts`
- `src/App.jsx`
