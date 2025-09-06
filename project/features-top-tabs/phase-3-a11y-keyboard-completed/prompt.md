# Phase 3 — Accessibility: Keyboard Navigation for Tabs

Goal
- Provide robust keyboard interactions for the tabs to meet accessible tab widget behaviors.

Scope
- Arrow key navigation between tabs (Left/Right or Up/Down) per WAI-ARIA Authoring Practices.
- Home/End keys to jump to first/last tab.
- Proper tab focus management: only active tab is tab-focusable (`tabIndex=0`), others `tabIndex=-1`.
- Maintain existing `aria-selected`, `role=tab`, `role=tablist`, and `role=tabpanel`.

Out of Scope
- Moving the tab group to the header (Phase 4).
- Deep-linked routing for tabs (Phase 4).

Implementation Steps
- In `src/App.jsx`, update the tab buttons to manage `tabIndex` and handle keydown events:
  - ArrowLeft/ArrowRight: move focus to previous/next tab (wrap around).
  - Home: focus first tab; End: focus last tab.
  - Space/Enter: activate focused tab (switch view state).
- Ensure the associated tabpanel `aria-labelledby` updates correctly.

Acceptance Criteria
- Users can navigate between tabs using arrow keys and activate a tab via Enter/Space.
- Focus stays on tabs and is not trapped or lost.
- Non-active tabs are not tabbable.
- No regressions in tab visuals or content switching from Phases 1 and 2.

References
- WAI-ARIA Authoring Practices: Tabs Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- `src/App.jsx` (tab UI)
