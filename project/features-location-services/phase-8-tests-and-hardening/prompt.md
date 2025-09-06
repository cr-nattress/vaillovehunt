# Phase 8 — Tests and Hardening

Goal
- Validate correctness, catch regressions, and harden boundaries for the location services.

Scope
- Unit tests for geolocation (mocked), IP fallback, caching, and zone classification.
- Integration test for the hook-driven UX (button triggers locate flow).
- Contract/schema tests for IP provider and reverse geocoding responses (if using Zod).

Out of Scope
- E2E mapping/directions flows.

Implementation Steps
- Unit tests:
  - Mock `navigator.geolocation` and test timeout/denied flows for `getPreciseLocation`.
  - Mock `fetch` for `getCoarseLocation` success/failure.
  - Test `locateZone` with points inside/outside polygons.
  - Test caching helpers (save/load with TTL).
- Integration tests (RTL):
  - A minimal `WhereAmIButton` using `useLocation()` that shows loading → zone or error.
- Contract tests:
  - Mock IP and Mapbox responses; validate via zod schemas if added.

Acceptance Criteria
- Tests pass locally and in CI.
- Failure modes never crash the app; friendly notifications occur if wired.
- Changes to provider payloads cause failing tests (if using schemas).
