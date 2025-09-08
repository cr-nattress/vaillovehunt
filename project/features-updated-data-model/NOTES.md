# Updated Data Model: App JSON + Org JSON

These notes guide implementation of a split data model backed by Netlify Blobs (via your existing Netlify Functions or a thin BlobService wrapper), while minimizing risk and avoiding regressions.

## Goals
- Store global app metadata + org registry in a single `App JSON`.
- Store each organization’s details in a separate `Org JSON` (one file per org).
- Add robust structures for hunts: rules, teams (captain/members), uploads pointers, stops, scoring, moderation, audit.
- Wire the New Adventure wizard to write to these JSON blobs and continue redirecting to the normal Event page.
- Allow EventService to optionally read from blobs (feature-flag controlled) while keeping mocks as fallback.

## File Layout
- App JSON key: `blobs/app.json` (or similar)
- Org JSON keys: `orgs/{orgSlug}.json`

## App JSON (Global)
- `schemaVersion`: string
- `etag`: string (optional) – for optimistic concurrency
- `updatedAt`: ISO string
- `app`: metadata
  - `name`, `environment`, `uiVersion`
  - `features`: `enableKVEvents`, `enablePhotoUpload`, `enableMapPage`
  - `defaults`: timezone, locale
  - `map`: tile provider/url/attribution
  - `email`: fromAddress, sendingEnabled
  - `privacy`: mediaRetentionDays, dataDeletionContact
  - `limits`: maxUploadSizeMB, maxPhotosPerTeam, allowedMediaTypes
- `organizations`: array of org summaries
  - `orgSlug`, `orgName`, `primaryContactEmail`, `createdAt`, `orgBlobKey`
  - optional `summary`: { huntsTotal, teamsCommon[] }
- `byDate`: optional index `{ [YYYY-MM-DD]: [{ orgSlug, huntId }] }` for fast “today’s hunts”

## Org JSON (Per Org)
- `schemaVersion`: string
- `etag`: string (optional)
- `updatedAt`: ISO string
- `org`: profile
  - `orgSlug`, `orgName`
  - `contacts`: [{ firstName, lastName, email, role? }]
  - `settings`: { defaultTeams[], timezone? }
- `hunts`: array
  - `id`, `slug`, `name`
  - `startDate`, `endDate`, optional `time` { start, end, timezone }
  - `status`: scheduled | active | completed | archived
  - `access`: { visibility: public|invite|private, joinCode?, pinRequired }
  - `scoring`: { basePerStop?, bonusCreative? }
  - `moderation`: { required?, reviewers[]? }
  - Teams (choose one model repo-wide and stick to it):
    - Multi-team: `teams`: [{ name, captain{first/last/email}, members[], uploads, ... }]
    - Single team: `teamCaptain`, `teamMembers`, and hunt-level `uploads`
  - `uploads`: pointers & summaries (for single-team model)
    - `store`: { blobsPrefix?, cloudinaryFolder? }
    - `summary`: { total, photos, videos, lastUploadedAt }
    - (later) `items[]` and `indices.byStop`
  - `stops[]`: { id, title, lat, lng, radiusMeters?, description?, difficulty?, hints[], requirements, assets?, audit? }
  - `rules`: { id, version, updatedAt, acknowledgement{required,text}, content{format,body}, categories? }
  - `geo`: optional notes/polygons
  - `stats`: optional derived fields (teamsRegistered, photosSubmitted, completedStops)
  - `audit`, `archival`

## Services & Schemas
- Zod Schemas
  - `src/types/appData.schemas.ts` – app-wide data
  - `src/types/orgData.schemas.ts` – per-org data
- BlobService (client abstraction)
  - `readJson<T>(key): { data, etag? }`
  - `writeJson<T>(key, data, expectedEtag?): { etag? }`
- OrgRegistryService (uses BlobService)
  - `loadApp()`, `loadOrg(key)`
  - `upsertApp(app, expectedEtag?)`, `upsertOrg(org, key, expectedEtag?)`
  - `addOrg(app, summary)`, `addHuntToOrg(org, hunt)`
  - `updateByDateIndex(app, dateStr, orgSlug, huntId)`
  - Slug helpers for org/hunt ids

## UI Integration
- New Adventure Wizard (`src/features/event/SplashScreen.tsx`)
  - Steps: `new-org` (org/contact form) → `new-hunt` (hunt name/date)
  - MVP Save: set `locationName` and `eventName` in `src/App.jsx`, `navigate('event')`, close splash
  - Blob Save (Phase 3):
    - Create/Update `orgs/{orgSlug}.json` with the new hunt
    - Append/maintain org summary in `app.json.organizations`
    - Update `app.json.byDate[YYYY-MM-DD]`
    - Handle `etag` conflicts (re-fetch/merge or warn + continue navigation)

- EventService (`src/services/EventService.ts`)
  - Add feature flag to source “today’s hunts” from `app.json.byDate` + org JSON
  - Keep mocks when flag is false

- Rules Rendering
  - Render `hunts[n].rules.content.body` as markdown
  - If `acknowledgement.required`, show checkbox/button and store acceptance (Zustand/localStorage)

- Teams & Uploads pointers
  - Multi-team – `hunts[n].teams[]` has `captain`, `members`, `uploads`
  - Single-team – `teamCaptain`, `teamMembers`, and hunt-level `uploads`
  - Uploads not functionally wired yet; pointers/summary only

## Concurrency & Safety
- Always read `etag` and `updatedAt`
- On write, send `expectedEtag` (or compare `updatedAt`) to detect conflicts
- On conflict: re-fetch, merge, retry or surface a gentle warning

## Testing Strategy
- Mock BlobService in tests (in-memory map)
- Tests:
  - New Adventure save → app.json & org.json updated
  - EventService blob-backed listing
  - Rules render & acknowledgement

## Migration (Optional)
- Script to split any existing single JSON into App/Org JSON and upload via functions

## Feature Flags
- Add environment flag or read from `app.app.features` once App JSON is loaded
- Suggested: `enableBlobEvents` to switch EventService source

