# Features: Top Tabs (Current vs Completed)

This track introduces a top tab control to toggle between Current and Completed tasks on the Hunt page, implemented incrementally across phases.

Phases
- Phase 1 — Tab UI Skeleton: visual tabs only with basic ARIA roles.
- Phase 2 — Wire View Logic: connect tabs to content (Current vs Completed).
- Phase 3 — Accessibility Keyboard: arrow/Home/End navigation, focus management.
- Phase 4 — Header & Deep Links (optional): move tabs into header and/or add hash deep links.

How to Mark a Phase Complete
- After you finish a phase and its acceptance criteria, rename the phase folder to append `-completed`.
  - Example: `phase-1-tab-ui-skeleton` → `phase-1-tab-ui-skeleton-completed`

Where to Work
- Main page container: `src/App.jsx`
- Task list and completed list: `src/features/app/StopsList.tsx`, `src/features/app/CompletedAccordion.tsx`
- Header (optional for Phase 4): `src/features/app/Header.tsx`
- Hash routing: `src/hooks/useHashRouter.ts`

Notes
- Keep styles consistent by using existing CSS variables (e.g., `var(--color-cabernet)`).
- Maintain ARIA roles for accessibility throughout.
- Consider testing the Completed tab with various numbers of finished tasks.
