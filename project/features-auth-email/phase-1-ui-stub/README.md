# Phase 1: UI Stub (No Email; Logs Only)

Goal: Add a new Step 0 to the Splash wizard for email-based sign-in. Do not send emails yet. Surface the UX and logging only, behind a feature flag.

Reference: `project/features-auth-email/README.md`

## Scope
- Add `ENABLE_EMAIL_SIGNIN` flag.
- Insert Step 0 in `src/features/event/SplashScreen.tsx`:
  - Email input, "Send me a magic link" button.
  - After submit, show "Check your inbox" screen (placeholder) with Resend (disabled) and Change email.
- Do not call any provider or function; log the intended call and email.
- Persist the typed email locally (for prefill only), but do not auto-login on reentry.

## Acceptance Criteria
- App builds; Step 0 appears only when `ENABLE_EMAIL_SIGNIN` is true.
- Submitting the email logs an info message and advances to a placeholder screen.
- Returning to Splash shows the email prefilled but still requires sending a link.
