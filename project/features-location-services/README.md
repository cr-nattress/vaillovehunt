# Features: Location Services

This track introduces a robust geolocation module that:
- Uses precise HTML5 Geolocation first
- Falls back to IP geolocation if denied/unavailable
- Optionally reverse-geocodes to human labels (Mapbox/Google)
- Classifies coordinates into local "Vail zones" using GeoJSON polygons and Turf.js
- Provides caching, privacy controls, and a simple React hook for UI integration
 - Is encapsulated behind a small facade so the rest of the app stays simple

Phases
- Phase 1 — Foundations: Types, APIs, Caching
- Phase 2 — Zone Classification (GeoJSON + Turf)
- Phase 3 — Optional Reverse Geocoding (Mapbox/Google)
- Phase 4 — React Hook + UX Integration
- Phase 5 — Zustand Integration (Optional)
- Phase 6 — Accuracy Controls, Battery & Performance
- Phase 7 — Privacy UX and Controls
- Phase 8 — Tests and Hardening

How to Mark a Phase Complete
- After completing a phase and verifying behavior, rename the folder to append `-completed`.
  - Example: `phase-1-foundations` → `phase-1-foundations-completed`

Where to Work
- Module (encapsulated): `src/location/` (new)
- Config: `src/config.ts`
- Store (optional): `src/store/appStore.ts`
- UI: `src/App.jsx` or a dedicated UI component for the “Use my location” action

Public API (facade)
- Location module exposes a minimal surface via `src/location/index.ts` only:
  - `initLocation(config?): Promise<void>` (optional)
  - `locate(options?): Promise<ResolvedLocation>`
  - `getLastKnown(): ResolvedLocation | null`
  - `getZone(): { id: string; name: string } | null`
  - `getLabel(): string | null`
  - `clearLocation(): void`
  - `setConsent(value: 'precise' | 'coarse' | 'none'): void`
  - `getConsent(): 'precise' | 'coarse' | 'none'`
- Optional React hook (re-exported by the facade): `useLocationService()`

Encapsulation
- Internal files like `location.ts`, `zones.ts`, `reverseGeocode.ts`, `privacy.ts` remain private and are not imported directly by the app.
- This keeps app complexity low and allows the module internals to evolve without breaking app code.
