# Phase 1 Prompt: Wizard Scaffold on Splash

Add a new "Set up a new adventure" branch inside the Splash overlay, with steps `new-org` and `new-hunt` placeholders.

Tasks:
1) In `src/features/event/SplashScreen.tsx`, extend the `step` union to: `events | teams | new-org | new-hunt`.
2) Wire the existing "Set up a new adventure" button to set `step` to `new-org`.
3) Render placeholder containers for `new-org` and `new-hunt` (e.g., headers and simple text).
4) Add a back control to return from `new-org/new-hunt` to `events`.
5) Do not add forms or persistence yet; this is scaffolding only.

Validation:
- Clicking "Set up a new adventure" shows the `new-org` placeholder.
- Back button returns to events list.
- No console errors; existing event/team flow unaffected.
