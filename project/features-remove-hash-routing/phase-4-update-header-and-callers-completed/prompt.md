# Phase 4 — Update Header and Navigation Callers

Goal
- Ensure all navigation triggers (menu items, buttons) use the store navigation actions and remove any lingering hash-based navigation calls.

Scope
- Audit `Header.tsx`, menus, and any components that navigate.
- Replace `onNavigate(navigateToPage)` patterns with store `navigate('hunt' | 'feed')`.
- Update props plumbed through components to carry store-driven handlers.

Out of Scope
- Persistence and back/forward support (Phase 5).

Implementation Steps
- In `Header.tsx`, accept `onNavigate` that calls store `navigate`.
- In `App.jsx`, pass `onNavigate={navigate}` from `useAppStore()`.
- Update any other buttons/links that referenced hash routing.
- Remove dead code referencing `useHashRouter`.

Acceptance Criteria
- All navigation is performed through store actions.
- No references to `window.location.hash` or `useHashRouter` remain in callers.

References
- `src/features/app/Header.tsx`
- `src/App.jsx`
- `src/store/appStore.ts`
