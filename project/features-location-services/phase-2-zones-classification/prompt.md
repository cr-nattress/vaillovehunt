# Phase 2 — Zone Classification (GeoJSON + Turf)

Goal
- Classify coordinates into "Vail zones" via GeoJSON polygons using Turf.js.

Scope
- Add `src/location/zones.ts` with:
  - `Zone` type
  - `ZONES` polygon definitions
  - `locateZone(lat, lng)` using `booleanPointInPolygon`
- Keep polygons lightweight and local to avoid bundle bloat.

Out of Scope
- Reverse geocoding, hooks, or UI usage

Implementation Steps
- Install `@turf/turf` if not present.
- Implement `Zone` and `ZONES` with at least Vail Village, Lionshead, Golden Peak.
- Write `locateZone(lat, lng)` and test with some known points.

Acceptance Criteria
- Coordinates inside polygons classify to the correct zone.
- Outside points return `null`.

Encapsulation & Public API
- No changes to the public API. Continue exposing only via `src/location/index.ts`:
  - `getZone()` returns the currently resolved zone after a `locate()` call.
- `zones.ts` is internal; do not import it directly from app code.
