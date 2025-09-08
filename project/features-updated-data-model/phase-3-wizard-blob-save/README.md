# Phase 3: New Adventure Wizard → Blob Save

Goal: Extend the wizard save to persist data to blobs using the new App/Org JSON model (App JSON + Org JSON), while keeping the same user experience and leaving mocks enabled as fallback.

Reference: `project/features-updated-data-model/NOTES.md`

Tasks:
- Use `OrgRegistryService` to:
  - Load `app.json` (create a default in-memory object if missing).
  - Check if the org exists; if not, create a new `orgs/{orgSlug}.json` with minimal structure and the new hunt.
  - If the org exists, append the hunt to `hunts[]` if unique by `id` or `slug`.
  - Insert/update org summary in `app.json.organizations`.
  - Update `app.json.byDate[YYYY-MM-DD]` with `{ orgSlug, huntId }`.
  - Write updates with `etag`/`updatedAt` check; handle conflicts by reloading and retrying once, else warn and continue.
- After persistence, continue with the MVP redirect behavior:
  - `setLocationName(orgName)`, `setEventName(huntName)`, navigate to Event page, close Splash.
- Errors in persistence should be surfaced via toast but not block navigation.

Acceptance Criteria:
- Creating a new adventure writes to org and app blobs correctly.
- Index by date is maintained.
- Redirect behavior is unchanged.
- On conflicts, a gentle warning appears and the app continues to Event page.
