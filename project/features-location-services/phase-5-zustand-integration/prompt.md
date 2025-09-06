# Phase 5 — Zustand Integration (Optional)

Goal
- Store resolved location, zone, and label in Zustand so any component can consume them, while honoring privacy choices.

Scope
- Add a `location` slice to `useAppStore` with:
  - `coords?: { lat: number; lng: number; accuracy: number }`
  - `zone?: { id: string; name: string } | null`
  - `label?: string | null`
  - `source?: 'geolocation' | 'ip' | 'cache'`
  - `consent?: 'precise' | 'coarse' | 'none'`
  - Actions: `setLocation(payload)`, `clearLocation()`, `setConsent(value)`
- Update `useLocation()` to optionally write to the store after success.
- Provide a selector-driven API to avoid re-renders (e.g., `selectZone`).

Out of Scope
- Long-term persistence of raw coordinates (avoid unless necessary).

Implementation Steps
- Add the slice in `src/store/appStore.ts` or a dedicated slice file.
- Export memoized selectors: `selectZone`, `selectLabel`, `selectConsent`.
- From `useLocation()`, call `setLocation` with minimal data (consider leaving out raw lat/lng if privacy mode is on).

Acceptance Criteria
- Other components can read `zone`/`label` from the store.
- Calling `clearLocation()` removes store values and clears cache.
- No regressions: `useLocation()` still returns hook-local state even without store consumers.

Guardrails
- Default consent to `'none'` and escalate only after explicit user action.
- Avoid storing raw coordinates beyond session unless required and consented.
