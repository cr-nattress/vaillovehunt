# Phase 2 — App Consumes Store Navigation

Goal
- Replace `useHashRouter` usage in the app UI with the Zustand navigation slice while keeping the hash in sync for now.

Scope
- In `src/App.jsx`, read `currentPage` and `taskTab` from the store instead of `useHashRouter`.
- Provide navigation via store actions (`navigate`, `setTaskTab`) to children via props.
- Keep a temporary effect that updates the hash when store navigation changes (so deep links continue to work during migration).

Out of Scope
- Removing the hash listener (Phase 3).

Implementation Steps
- Swap out `const { currentPage, navigateToPage } = useHashRouter()` with `const { currentPage, navigate, taskTab, setTaskTab } = useAppStore()`.
- Wire header/menu and tab UI to call store actions.
- Add a `useEffect` that writes to `window.location.hash` when `currentPage` changes.

Acceptance Criteria
- The UI navigates using store state only.
- The URL hash updates to reflect store navigation changes.
- No functional regressions in navigation.

References
- `src/App.jsx`
- `src/features/app/Header.tsx`
- `src/store/appStore.ts`
