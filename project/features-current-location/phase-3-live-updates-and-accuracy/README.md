# Phase 3: Live Updates, Accuracy Circle, Recenter

Goal: Improve UX by updating position over time and visualizing accuracy.

Key Objectives:
- Add a "Locate Me" button to refetch location and recenter.
- Option A: Add a geolocation watch utility (or poll) to update the marker over time.
- Draw an accuracy circle using `coords.accuracy` (cap to a display threshold for readability).
- Gracefully handle watch errors and cleanup watchers on unmount.

Acceptance Criteria:
- Tapping "Locate Me" recenters to the user.
- When moving (or on repeated fetch), the marker updates.
- An accuracy circle is visible around the location.

Out of Scope:
- Switching tile providers.
- Advanced map controls.
