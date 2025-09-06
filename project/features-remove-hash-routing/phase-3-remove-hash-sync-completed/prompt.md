# Phase 3 — Remove Hash Sync (URL Decoupling)

Goal
- Stop relying on `window.location.hash` for navigation. The app should render solely from Zustand navigation state.

Scope
- Remove the effect that mirrors store navigation to the hash.
- Stop subscribing to hashchange; delete or noop `useHashRouter` usage.
- Ensure direct page loads render correctly without URL hash (default to hunt or last persisted page in Phase 5).

Out of Scope
- Persisting navigation across refresh (Phase 5).

Implementation Steps
- Remove `hashchange` listeners and any `navigateToPage` calls from `useHashRouter`.
- Option A: Comment out `useHashRouter` import/usage in `src/App.jsx` and delete the file in Phase 6.
- Ensure `Header.tsx` uses store-powered navigation callbacks.
- Manually test navigation between 'hunt' and 'feed'.

Acceptance Criteria
- App navigates fully via store state; URL hash remains unchanged during navigation.
- No runtime references to `window.location.hash` for app navigation.

References
- `src/App.jsx`
- `src/features/app/Header.tsx`
- `src/hooks/useHashRouter.ts` (to be retired)
