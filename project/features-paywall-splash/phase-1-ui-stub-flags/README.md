# Phase 1: Paywall UI Stub + Feature Flags (No Payments)

Goal: Add a new `paywall` step (Step 5) inside `src/features/event/SplashScreen.tsx` and centralize the feature flags. No provider calls yet.

Scope
- Render paywall step only when `hunts[n].access.paywallRequired === true` and `ENABLE_PAYWALL` flag is ON.
- Show price/currency from `hunts[n].access` with safe defaults when absent.
- Provide buttons: Pay (disabled in this phase), Already Purchased? (disabled), Cancel (back to previous step).
- Auto-skip step when paywall is not required or flag is OFF.

Acceptance Criteria
- App builds; navigating the wizard shows the paywall step under the right conditions.
- No network calls or provider code.
- Clear logging to indicate why the step is shown/skipped.
