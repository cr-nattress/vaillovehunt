# Phase 8 Prompt: Persistence & Media Uploads (Images + Video)

Reference notes:
- `project/features-new-adventure/phase-8-persistence-and-uploads/README.md`
- `project/features-updated-data-model/NOTES.md`

Implement best‑effort persistence and media uploads on final Submit of the wizard.

Tasks:
1) Media detection & limits
   - Detect image vs video by MIME/type.
   - Enforce size caps (e.g., images ≤ 12MB; videos ≤ 200MB). Show early error if exceeded.
2) Upload helper
   - Extend the client upload helper to support `resource_type: image|video`.
   - Use folder/tag convention: `orgSlug/huntSlug/teams/{teamName}/stops/{stopId}` and tags (`orgSlug`, `huntId`, `teamName`, `stopId`).
   - For video, request a poster (thumbnail) and optional web‑friendly mp4 (eager transformation if configured).
3) Wizard Submit integration
   - In `src/features/event/SplashScreen.tsx`, on final Submit:
     - For each step with media, upload best‑effort and collect URLs/publicIds.
     - Build `stops[]` with `assets.coverUrl` (poster or image URL) and optional `thumbnailUrl`.
     - Build the hunt object with name, date, `location{city,state,zip}`, and `stops[]`.
4) Persistence via OrgRegistryService
   - Upsert `orgs/{orgSlug}.json` to add/update the hunt.
   - Upsert `blobs/app.json` to ensure the org registry entry exists and update `byDate[YYYY-MM-DD]` with `{ orgSlug, huntId }`.
   - Use etag/updatedAt for optimistic concurrency; on conflict, re‑fetch and retry once.
5) Non‑blocking UX
   - Wrap uploads and writes in try/catch; on error, show a toast and continue navigation.
   - After attempts, set `locationName`/`eventName`, close Splash, and navigate to the Event page.
6) Tests
   - Mock BlobService and upload helper to simulate success and failure.
   - Verify that JSON writes are attempted and that navigation occurs even on errors.

Validation:
- Successful uploads attach assets to stops and JSON writes reflect new hunt/steps.
- Failures are warned but do not block navigation.
- EventService (when blob flag ON) shows the new hunt on the correct date.
