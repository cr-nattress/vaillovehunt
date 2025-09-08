# Phase 1 Prompt: Map Page Scaffold

Implement a new Map page accessible from the hamburger menu without enabling geolocation yet.

Tasks:
1) Create `src/features/map/MapPage.tsx` with a basic container (div) and a title "Map".
2) Add a new `page: 'map'` option in the navigation store/type if needed.
3) In `src/App.jsx`, add a render branch for `currentPage === 'map'` to render `<MapPage />`.
4) In `src/features/app/Header.tsx`, add a "Map" menu item to call `onNavigate('map')`.
5) Verify page loads, existing flows unaffected.

Validation:
- Open the app → Hamburger menu → Map. The page shows a placeholder container.
- No errors in console.
- Navigate back to other pages successfully.
