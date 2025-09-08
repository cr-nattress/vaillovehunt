# Phase 2: Organization & Contact Form (Splash Wizard)

Goal: Implement the first step of the wizard to collect organization and contact info, staying inside the Splash overlay.

Key Objectives:
- In `src/features/event/SplashScreen.tsx`, implement the `new-org` step with a form:
  - Organization (company) name [required]
  - First name [required]
  - Last name [required]
  - Email [required, basic format validation]
- Add inline validation messaging and disable the Next button until valid.
- Persist the form values in component state so Step 3 can consume them.
- Keep Back to events working.

Acceptance Criteria:
- User can enter org + contact info and proceed to the next step (`new-hunt`).
- Invalid input shows errors; Next is disabled until valid.
- No console errors; existing flows unaffected.

Out of Scope:
- Persisting to server/KV.
- Navigation away from the Splash overlay.
