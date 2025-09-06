# Phase 1 — Foundations: Types, APIs, Caching

Goal
- Implement precise geolocation with timeout and accuracy controls, IP fallback, and simple caching.

Scope
- Add `src/location/` module with:
  - `types.ts` — `Coords`, `LocationSource`, `ResolvedLocation`
  - `location.ts` — `getPreciseLocation`, `getCoarseLocation`, `getUserLocationSmart`
  - `cache.ts` (optional) — helpers to store/load recent location
- Use HTML5 Geolocation first; if unavailable/denied/timeout, use IP provider
- Cache last success in `localStorage` for 10 minutes

Out of Scope
- Zone classification, reverse geocoding, React hooks, or UI changes

Implementation Steps
- Create files under `src/location/` with the functions above
- Read IP provider URL from `src/config.ts` (e.g., `VITE_IP_GEO_URL`), default to `https://ipapi.co/json/`
- Add a timeout to `getPreciseLocation` (e.g., 8000ms)
- Ensure all functions are safe to call even if permissions are denied

Acceptance Criteria
- `getUserLocationSmart()` returns a `ResolvedLocation` with `source` in `['geolocation','cache','ip']`
- Errors do not crash the app; timeouts handled gracefully
- Cache respected for up to 10 minutes

Encapsulation & Public API
- Create `src/location/index.ts` as the only public entry. Re-export:
  - `initLocation(config?)`, `locate(options?)`, `getLastKnown()`, `getZone()`, `getLabel()`, `clearLocation()`, `setConsent()`, `getConsent()`
- Keep `location.ts` and any helpers private; app code must not import them directly.
