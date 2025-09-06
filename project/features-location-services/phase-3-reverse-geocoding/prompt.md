# Phase 3 — Optional Reverse Geocoding (Mapbox/Google)

Goal
- Convert coordinates to human-readable labels using Mapbox or Google APIs. Keep optional and feature-flagged.

Scope
- Add `src/config.ts` for `VITE_MAPBOX_TOKEN` (or Google key) and flags.
- Add `src/location/reverseGeocode.ts` with `reverseGeocode(lat, lng)`.
- Handle missing token gracefully by returning `'Unknown area'`.

Out of Scope
- UI changes; hook integration arrives in Phase 4.

Implementation Steps
- Implement `reverseGeocode(lat, lng)` using Mapbox Places API.
- Parse response and return a concise label (e.g., POI or neighborhood).
- Add error handling (network errors, 429/5xx) with capped retries.

Acceptance Criteria
- When configured, function returns a label for valid coords.
- When unconfigured or on error, returns `'Unknown area'` without throwing.

Encapsulation & Public API
- Reverse geocoding remains internal. Public access is via the facade getters after a `locate()` call:
  - `getLabel(): string | null`
- Do not import `reverseGeocode.ts` directly from app code.
