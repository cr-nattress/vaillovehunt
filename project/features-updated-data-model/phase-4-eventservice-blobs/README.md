# Phase 4: EventService Blob-Backed Listing

Goal: Teach `EventService` to read events from Blobs (App/Org JSON) behind a feature flag, while keeping the current mock implementation as fallback.

Reference: `project/features-updated-data-model/NOTES.md`

Tasks:
- Add a feature flag check (from App JSON or an env/config) to toggle blob-backed events.
- When flag is ON:
  - Load `app.json` using `OrgRegistryService`.
  - Get today’s date (YYYY-MM-DD) and read `app.byDate[date]`.
  - For each entry, resolve org name (from `app.organizations` or read the org JSON for more details).
  - Return an array matching `OrgEvent[]` shape used by the UI.
- When flag is OFF:
  - Keep returning mock events to avoid regressions.

Acceptance Criteria:
- With flag ON, EventService returns hunts from blobs.
- With flag OFF, the previous mocked list is used.
- No UI regressions; Splash event listing continues to work.
