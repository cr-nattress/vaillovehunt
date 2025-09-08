# Phase 3 Prompt: Hunt Creation & MVP Save

Implement the `new-hunt` step to capture hunt details and redirect to the normal event flow after saving.

Tasks:
1) In `src/features/event/SplashScreen.tsx`, render a form for the `new-hunt` step with fields:
   - Hunt name [required]
   - Hunt date [required, YYYY-MM-DD]
2) Wire Save to call up to `App` with the org/hunt info collected in Phase 2:
   - `setLocationName(orgName)` and `setEventName(huntName)`
   - `navigate('event')` and close the splash
   - Optionally call `DualWriteService.createSession(sessionId, { orgName, eventName, createdBy })`
3) Provide Back to return to `new-org` without losing org/contact data.

Validation:
- Entering valid values enables Save.
- Save redirects to Event page with location and event populated.
- No console errors; Back works and preserves prior entries.
