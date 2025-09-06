# Phase 7 — Privacy UX and Controls

Goal
- Provide explicit consent options, allow coarse-only mode, and support "forget my location" to respect user privacy.

Scope
- Add a simple consent UI (button or small modal) offering:
  - Precise location (Geolocation)
  - Use city only (IP-based)
  - No thanks
- Store consent in the Zustand `location` slice (Phase 5) and honor it in `useLocation()`.
- Add a `clearCache()` path to remove stored values.

Out of Scope
- Complex preference pages; keep UX minimal and clear.

Implementation Steps
- Create a small consent component (e.g., `src/location/ConsentDialog.tsx`) that accepts callbacks.
- Update `useLocation()` to read/write `consent` and select precise/IP flows accordingly.
- Wire a "Forget my location" action that clears store + cache.

Acceptance Criteria
- Users can pick precise vs coarse vs none and change later.
- Clearing location removes both cache and store values.
- App never prompts without a user gesture.
