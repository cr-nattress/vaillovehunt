# Phase 2 Prompt: Current Location Integration

Add current location fetch to MapPage using existing location module.

Tasks:
1) In `src/features/map/MapPage.tsx`, import and call `getUserLocationSmart({ timeout: 12000 })` on mount.
2) Save the returned `coords` to component state and center the map accordingly.
3) Render a simple marker UI at the user position; show an inline error if location fails.
4) Keep a reasonable fallback center (e.g., Vail) when user location not available.

Validation:
- With permission granted, Map centers to current location and shows marker.
- With permission denied or timeout, an inline message appears and map uses fallback center.
- No regressions to navigation.
