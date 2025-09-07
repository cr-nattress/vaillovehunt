# Phase 2 — Accessibility & Interactions (Tabs + Focus)

Goal
- Ensure tab navigation and card interactions are fully accessible with predictable keyboard behavior and focus management.

Scope
- Tabs in `src/App.jsx`:
  - Arrow key navigation (Left/Right) and Home/End per WAI-ARIA Tabs.
  - Only active tab is tabbable; others have `tabIndex=-1`.
  - Maintain `aria-selected`, `role=tab`, `role=tablist`, `role=tabpanel`.
- Stop card interactions in `src/features/app/stop-card/*`:
  - Visible focus styles on interactive elements.
  - Maintain/restore focus after expand/collapse or upload completion.

Out of Scope
- Visual restyling beyond focus indicators.

Implementation Steps
- Tabs: add keydown handlers and tabIndex management; verify with keyboard only.
- StopCard: ensure `onClick` equivalents work with Enter/Space and do not steal focus unexpectedly.
- Add a tiny `aria-live` region (polite) for short status messages if not present.

Acceptance Criteria
- Tabs can be navigated using arrow keys and activated with Enter/Space.
- Focus remains visible and predictable when toggling completed card sections or after uploading.
- Screen readers announce tab selection and panel changes correctly.

Guardrails
- Do not change the tab visual design in this phase.
- Avoid introducing new dependencies; keep logic small and local.
