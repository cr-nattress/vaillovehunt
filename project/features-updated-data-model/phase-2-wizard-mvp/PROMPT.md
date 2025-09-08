# Phase 2 Prompt: New Adventure Wizard (MVP Local Save)

Reference notes: `project/features-updated-data-model/NOTES.md`

Implement the Splash-based wizard (org/contact → hunt) and on save only update local state and navigate to Event. No blob writes yet.

Tasks:
1) In `src/features/event/SplashScreen.tsx`, add wizard steps: `new-org`, `new-hunt`.
2) Build `new-org` form with fields (required + basic validation):
   - Organization (company) name
   - First name
   - Last name
   - Email
3) Build `new-hunt` form with fields (required):
   - Hunt name
   - Hunt date (YYYY-MM-DD)
4) Preserve values between steps in component state; add Back navigation to `events`.
5) On Save (MVP):
   - Call up to `src/App.jsx` to set `locationName = orgName` and `eventName = huntName`.
   - `navigate('event')` and close the Splash overlay.

Validation:
- Forms validate and prevent submission until valid.
- Save performs local navigation and state update; no calls to blobs yet.
- Existing flows keep working.
