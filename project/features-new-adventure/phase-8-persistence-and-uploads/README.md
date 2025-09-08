# Phase 8: Persistence & Media Uploads (Images + Video)

Goal: On final Submit in the New Adventure wizard, persist the new org/hunt/steps to blobs and upload optional media (image or video) for each step. Keep UX non‑blocking.

Reference notes:
- `project/features-updated-data-model/NOTES.md`
- `project/features-new-adventure/README.md`

## Scope
- Best‑effort uploads: do not block navigation on failures; surface toasts.
- For each step with media:
  - If image: upload as image; optionally generate thumbnail.
  - If video: upload as video; generate a poster (thumbnail) for display and optionally a web‑friendly mp4.
- Persist Org JSON with steps and their `assets` (coverUrl/thumbnailUrl).
- Maintain App JSON org registry and `byDate` index.

## Upload Strategy
- **Resource types**: `image` vs `video` (Cloudinary `resource_type`)
- **Security**: start with a tightly scoped unsigned preset for dev (size/format/folder limits), migrate to signed uploads later.
- **Folders/tags**: `orgSlug/huntSlug/teams/{teamName}/stops/{stopId}`; tags: `orgSlug`, `huntId`, `teamName`, `stopId`.
- **Limits**: enforce size caps client‑side (images ~10–12MB, videos ~100–200MB max).
- **Progress**: show progress and allow cancellation; on cancellation, skip asset and continue.

## Persistence Steps
1) Build `orgSlug`, `huntSlug`, `stopId` for folder structure.
2) For each step with media:
   - Determine type (image/video) from MIME.
   - Upload; receive URLs and provider IDs.
   - Derive poster/thumbnail for UI.
3) Construct hunt object with `location` and `stops[]` including `assets`.
4) `OrgRegistryService` writes:
   - Upsert `orgs/{orgSlug}.json` with added/updated hunt.
   - Upsert `app.json` org registry and `byDate[YYYY-MM-DD]`.
5) `try/catch`: on failure, toast warning and proceed.
6) Finally, set `locationName`/`eventName`, close splash, and navigate.

## Acceptance Criteria
- After Submit, user lands on Event page even if some uploads or writes fail.
- Org JSON reflects new hunt/steps with any available assets.
- App JSON index updated for the hunt date.

## Testing
- Mock upload success/failure, ensure persistence continues.
- Mock etag conflict on write; ensure retry then warn and proceed.
- Verify EventService blob‑backed listing finds the new hunt when flag is on.
