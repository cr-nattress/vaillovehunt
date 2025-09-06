# Phase 5 — History & Persistence (Back/Forward, Local Persistence)

Goal
- Provide natural navigation history (back/forward) without relying on hash routing and persist the last visited page/tab across reloads.

Scope
- Add an in-memory history stack within the store or use the browser History API in a URL-neutral way (e.g., `history.pushState` without hash segments).
- Persist `currentPage` and `taskTab` to localStorage (or your DualWriteService) on change; restore on boot.
- Provide a fallback default (e.g., 'hunt' and 'current') if nothing is persisted.

Out of Scope
- Introducing new URLs or query parameters.

Implementation Steps
- When `navigate(page)` is invoked, push to a store-managed history stack.
- Implement `goBack()` and `goForward()` actions in the store.
- Hook `window.onpopstate` to call store `goBack()`/`goForward()` if using the History API.
- Save `currentPage`/`taskTab` in `localStorage` (e.g., keys `nav.page`, `nav.tab`).
- On app mount, attempt to restore from persistence.

Acceptance Criteria
- Using the browser Back/Forward returns to prior store navigation state without hashes.
- Refreshing the page resumes the last page/tab.
- No regression to hash routing.

References
- `src/store/appStore.ts`
- `src/App.jsx`
