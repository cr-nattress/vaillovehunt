# Features: Mobile Sticky Footer

This track introduces a bottom-fixed, mobile-friendly footer that adapts its actions based on the selected top tab (Current vs Completed) on the Hunt page.

Phases
- Phase 1 — Footer Skeleton: fixed footer layout, theming, and safe-area handling.
- Phase 2 — Wire Static Links: render three consistent footer items — Event, Challenges, Social — and connect them to the same links across the app (not tab-dependent for now).
- Phase 3 — State & Accessibility: enable/disable based on real state, add ARIA labels, and keyboard activation.
- Phase 4 — Responsive Polish: refine behavior on tablets/desktop, ensure no overlap with modals/keyboard.

How to Mark a Phase Complete
- After you finish a phase and its acceptance criteria, rename the phase folder to append `-completed`.
  - Example: `phase-1-footer-skeleton` → `phase-1-footer-skeleton-completed`

Where to Work
- Primary component: `src/features/app/FooterNav.tsx` (new)
- Integration point: `src/App.jsx` (drive via `taskTab` and router `currentPage`)
- Related actions & state: `src/features/app/StopsList.tsx`, `src/features/app/StopCard.tsx`, and services (upload, collage, share)
- Header/tabs context: `src/features/app/Header.tsx`, `src/hooks/useHashRouter.ts`

Notes
- Respect safe areas: use `padding-bottom: env(safe-area-inset-bottom)` where applicable.
- Ensure main content has bottom padding equal to footer height to avoid overlap.
- Limit to 3–4 visible actions; consider an overflow if needed.
 
 Footer Items (for now)
 - Event — link to a designated event information URL or in-app section
 - Challenges — link to the main Hunt/Challenges page
 - Social — link to a social/feed URL or in-app feed
 All three items should be the same regardless of where the user is in the app for now.
