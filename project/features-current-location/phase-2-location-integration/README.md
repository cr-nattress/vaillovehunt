# Phase 2: Integrate Current Location (Static Fetch)

Goal: Use existing location utilities to fetch the user's current location once and center the map.

Key Objectives:
- Import `getUserLocationSmart()` from `src/location/location.ts`.
- On MapPage mount, fetch location and store it in `useState`.
- Display a marker for the user's position (placeholder UI acceptable until Phase 3).
- Provide error messages when location is unavailable (permission denied, timeout, etc.).

Acceptance Criteria:
- First load centers to user location when available; otherwise shows a fallback center.
- Errors are visible (Toast or inline message), but the page remains usable.

Out of Scope:
- Live updates/watch position.
- Accuracy circle and recenter control (added next phase).
