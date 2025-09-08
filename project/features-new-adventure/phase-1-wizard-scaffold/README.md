# Phase 1: New Adventure Wizard Scaffold (Splash Overlay)

Goal: Add a new "Set up a new adventure" branch inside `SplashScreen` that remains on the overlay and presents step navigation scaffolding.

Key Objectives:
- Extend `src/features/event/SplashScreen.tsx` with a new `step` union: `events | teams | new-org | new-hunt`.
- Add a handler for the existing "Set up a new adventure" button to set step to `new-org`.
- Display a placeholder wizard container for `new-org` and `new-hunt` (no forms yet).
- Keep the existing events/teams flow working.

Acceptance Criteria:
- Clicking "Set up a new adventure" opens the wizard placeholder (still on splash overlay).
- User can navigate back to the events list.
- No console errors; existing pages unaffected.

Out of Scope:
- Form fields and validation.
- Persistence or redirects.
