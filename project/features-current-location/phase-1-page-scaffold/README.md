# Phase 1: Map Page Scaffold (Hamburger Menu Entry)

Goal: Add a new "Map" page accessible from the hamburger menu. Render a basic map container with placeholder content (no geolocation yet).

Key Objectives:
- Add a `MapPage` component at `src/features/map/MapPage.tsx` (empty scaffold).
- Wire a new navigation target `map` using existing navigation store/routing in `src/App.jsx`.
- Add a "Map" link in the hamburger menu (`src/features/app/Header.tsx`) that navigates to `map`.
- Ensure page layout (header/footer) remains consistent and nothing else breaks.

Acceptance Criteria:
- Tapping the hamburger "Map" item opens a new page with a placeholder map container.
- No console errors; existing pages and flows unaffected.
- The new page is responsive and matches app styling.

Out of Scope:
- Geolocation, markers, or live updates.
- External libraries.
