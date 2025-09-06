# Phase 4 — React Hook + UX Integration

Goal
- Provide a simple React hook to invoke location resolution on user action and surface zone and label to the UI.

Scope
- Add `src/location/useLocation.ts` that exposes:
  - `state: 'idle' | 'locating' | 'success' | 'error'`
  - `location: ResolvedLocation | null`
  - `zone: Zone | null`
  - `label: string | null`
  - `locate(): Promise<void>`
  - `clearCache(): void`
- Add a small UI entry point (e.g., `WhereAmIButton`) in a suitable view (Hunt page) that triggers `locate()`.
- Show a short microcopy near the button explaining why location is useful.

Out of Scope
- Persisting zone/label into Zustand (Phase 5).

Implementation Steps
- Implement `useLocation()` with `getUserLocationSmart()` from Phase 1, `locateZone()` from Phase 2, and optional `reverseGeocode()` from Phase 3.
- Handle errors via NotificationService (if available) and set `state='error'`.
- Add a demo button component under `src/location/WhereAmIButton.tsx` (optional) that consumes the hook.
- Integrate the button in `src/App.jsx` (or a relevant component) with clear CTA copy.

Acceptance Criteria
- Clicking the button resolves a location, sets a zone (or null), and optionally shows a label.
- Deny/timeout paths do not crash; fallback works (cache or IP).
- UX transitions: idle → locating → success/error are visible and accessible.

Encapsulation & Public API
- Re-export `useLocationService()` from `src/location/index.ts` for convenience.
- App code should import only from `src/location` and never from internal files.
