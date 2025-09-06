# Phase 4 — Header Placement and Deep Links

Goal
- Optionally move the top tabs into the global header and add hash-based deep linking so users can bookmark/share a specific tab.

Options
- A) Keep tabs in the hunt page body (simpler). Only implement deep linking.
- B) Move the tab controls into `Header.tsx` so they’re visible at the top. Wire events through `App.jsx`.

Scope
- Add a `tab` parameter to the hash (e.g., `#/hunt?tab=completed` or `#/?tab=completed`).
- Parse the tab param in `App.jsx` on mount and when hash changes to set the current tab.
- When the user switches tabs, update the hash accordingly without reloading the page.
- If option B is selected, lift tab state into `App.jsx` and pass handlers/selected state to `Header` via props.

Out of Scope
- Additional page routes beyond the current `hunt` and `feed`.

Implementation Steps (Deep Links)
- Decide on a hash format:
  - Simpler: `#/?tab=current|completed` for the hunt page.
- Update `useHashRouter.ts` or add a lightweight parser in `App.jsx` to read the `tab` query from `location.hash`.
- Sync tab state when the hash changes.
- Update tab click handlers to push hash updates (preserving `#/hunt` or base `#` segment).

Implementation Steps (Header Placement — optional)
- Add optional props to `Header.tsx`: `activeTab`, `onChangeTab`.
- Render the two-tab control alongside the menu button, styled for the header background.
- Ensure contrast and spacing are correct in the cabernet header.

Acceptance Criteria
- Navigating directly to a deep link (e.g., `#/?tab=completed`) selects the Completed tab and shows the proper content.
- Switching tabs updates the hash without a full page reload.
- If moved to header, tabs are visible, accessible, and styled correctly.
- No regressions in existing navigation (e.g., switching to `feed`).

References
- `src/App.jsx` (tab state and page rendering)
- `src/features/app/Header.tsx` (global header)
- `src/hooks/useHashRouter.ts` (hash routing)
