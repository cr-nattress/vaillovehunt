# User Story: Join a New Adventure via Splash Wizard

## As a
Guest participant (non-company user)

## I want
To join today’s scavenger hunt by selecting the organization, event, and team, and then proceed to the challenge.

## So that
I can quickly start participating without complex setup.

## Acceptance Criteria
- [ ] I can see “Today’s hunts” in the Splash and select one.
- [ ] I can pick my team (e.g., RED/GREEN/BLUE).
- [ ] If rules exist, I must acknowledge them before continuing.
- [ ] If a paywall is enabled (flag), I must see the pay step (stub for now).
- [ ] I reach the Event page and see my team and event in the header.

## Notes
- Future: email magic-link step (if `ENABLE_EMAIL_SIGNIN`), entitlements check for paywall.
- Future: smart resume may skip steps for returning users when eligible.

## Design/References
- `src/features/event/SplashScreen.tsx`
- `project/features-new-adventure/README.md`
- `project/features-paywall-splash/README.md`

## Tasks (optional)
- [ ] Ensure EventService lists today’s hunts (API/blobs/mocks)
- [ ] Implement team selection persistence
- [ ] Wire rules acknowledgement storage
- [ ] Add paywall stub behind feature flag
