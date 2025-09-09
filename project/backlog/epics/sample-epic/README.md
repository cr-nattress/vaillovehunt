# Epic: New Adventure Creation & Onboarding

## Problem Statement
Event organizers and participants need a streamlined way to create and join a new scavenger hunt. The current flow is fragmented and requires multiple manual steps.

## Goals & Non-Goals
- Goals:
  - Reduce time-to-event for new and returning users
  - Support creating a hunt with location and steps/hints
  - Prepare for paywall and email-auth gates
- Non-Goals:
  - Advanced admin moderation UI
  - Full analytics dashboard

## Scope
- Splash wizard with org/contact, hunt details, location, steps builder
- Smart resume for returning users (optional flag)
- Placeholder paywall step (flagged)

## Success Metrics / KPIs
- Time from app open to Event page
- Completion rate of wizard
- Drop-off before first upload

## Risks & Assumptions
- Blob/KV availability; flaky email delivery in future auth
- Mobile network constraints for media

## Links
- `project/features-new-adventure/README.md`
- `project/features-updated-data-model/NOTES.md`
- `project/features-paywall-splash/README.md`

## User Stories
- See `user-stories/` for concrete stories.
