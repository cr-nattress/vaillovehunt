# Email Magic Link: Status

This status file is updated after each phase to reflect progress and next steps.

## Phase Checklist
- [ ] Phase 1: UI Stub (no email; logs only)
- [ ] Phase 2: Functions (dummy provider; log link)
- [ ] Phase 3: Email Provider (SendGrid/Postmark/Resend) + rate limits
- [ ] Phase 4: Hardening (short-lived bootstrap, reentry enforcement, logout)
- [ ] Phase 5: Integrations (paywall entitlements, rules acceptance post-auth)

## Current Phase
- Not started. Begin with Phase 1.

## Notes
- Keep `ENABLE_EMAIL_SIGNIN` default false until end-to-end verified in dev.
- All endpoints must be Netlify Functions.
