# Phase 4: Accessibility, Attribution, and Tests

Goal: Finish the feature by ensuring a11y, proper attribution, and regression tests.

Key Objectives:
- Ensure proper attribution for tiles (e.g., "© OpenStreetMap contributors").
- Add ARIA labels for map and controls (e.g., `aria-label="Locate Me"`).
- Provide keyboard operability for the control button(s).
- Add integration test(s) that mock geolocation and assert marker rendering and recentering.

Acceptance Criteria:
- Accessibility checks pass (labels, keyboard nav).
- Attribution is always visible.
- Tests simulate location success/failure and verify UI behavior.

Out of Scope:
- Changing providers to MapLibre/vector tiles (future enhancement).
