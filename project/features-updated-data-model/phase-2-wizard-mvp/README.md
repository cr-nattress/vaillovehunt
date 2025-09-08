# Phase 2: New Adventure Wizard (MVP Local Save)

Goal: Implement the "New Adventure" wizard inside `SplashScreen` with two steps (org/contact → hunt), and on save only update local app state and navigate to the Event page. No blob writes yet.

Reference: `project/features-updated-data-model/NOTES.md`

Tasks:
- Extend `src/features/event/SplashScreen.tsx` to include steps: `new-org`, `new-hunt`.
- Step `new-org` form: org/company name, first name, last name, email (required + basic validation).
- Step `new-hunt` form: hunt name (required) and hunt date (YYYY-MM-DD required).
- On Save (MVP):
  - Call into `src/App.jsx` to set `locationName = orgName` and `eventName = huntName`.
  - Navigate to Event page and close the Splash overlay.
- Provide Back navigation between steps and back to events list.

Acceptance Criteria:
- Wizard validates required fields, preserves values across steps, and navigates correctly.
- No blob writes yet; no changes to EventService.
- No regressions in existing flows.
