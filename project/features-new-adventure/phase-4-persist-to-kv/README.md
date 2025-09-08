# Phase 4: Persist New Org and Hunt to KV (Optional Enhancement)

Goal: Save the newly created organization and scavenger hunt to Netlify KV via existing serverless functions. Keep the UI workflow the same; add persistence behind the scenes.

Key Objectives:
- Use `/.netlify/functions/kv-upsert` to save JSON records for org and event.
- Suggested keys:
  - `orgs/{orgSlug}.json`
  - `events/{YYYY-MM-DD}/{orgSlug}.json`
- Slug generation: lowercase, spaces→`-`, strip non-alphanumerics.
- Update `EventService` to optionally fetch from KV (feature-flag or env) when not mocking.
- Handle errors gracefully and show a toast if save fails (do not block redirect in MVP).

Acceptance Criteria:
- On Save (Phase 3), perform KV upserts for org and event.
- Event listing (if KV read is enabled) shows the newly created event for today.
- Errors are logged and surfaced via toast but don’t break navigation.

Out of Scope:
- Multi-day events or advanced metadata.
- Authentication/authorization.
