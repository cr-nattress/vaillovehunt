# Phase 3: Hunt Creation Form (Splash Wizard)

Goal: Implement the second wizard step to define a new scavenger hunt, then wire the MVP save that redirects to the normal event flow.

Key Objectives:
- In `src/features/event/SplashScreen.tsx`, implement `new-hunt` step with a form:
  - Hunt name [required]
  - Hunt date [required, YYYY-MM-DD]
- On Save (MVP):
  - Call back into `App` to set `locationName = orgName` and `eventName = huntName`.
  - Navigate to the normal Event page and close Splash.
  - Optionally call `DualWriteService.createSession(sessionId, sessionData)`.

Acceptance Criteria:
- Entering valid fields enables Save.
- Save redirects to Event page with org/event populated.
- No console errors; back to events still works.

Out of Scope:
- Persisting org/hunt to KV (Phase 4).
- Team creation/assignment (reuse existing team logic for now).
