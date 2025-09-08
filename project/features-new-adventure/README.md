# New Adventure Setup: Technical Design & Integration Guide

This document provides a deep technical analysis and an implementation guide to add the expanded "New Adventure" setup to the existing codebase. It focuses on incremental, low‑risk changes and explains where to be careful in complex regions.

## Goal
- Enable a multi‑step wizard on the Splash overlay that collects:
  - Organization + organizer contact
  - Hunt details (name, date, location: city/state/zip)
  - Steps (stops) with hints and an optional image per step
- MVP: on submit, navigate into the Event flow using local state only
- Enhanced: persist the new org/hunt/steps to App/Org JSON in blob storage and update the "today" index, with non‑blocking UX

## Current App Foundations (Relevant Components)
- `src/features/event/SplashScreen.tsx`: Splash overlay, event and team selection; wizard scaffolding already started.
- `src/App.jsx`: App shell, navigation, and state handoff (e.g., `setLocationName`, `setEventName`, `navigate('event')`).
- `src/services/EventService.ts`: Tiered event source support (API → blobs → mocks) via `config.ENABLE_BLOB_EVENTS`.
- `src/location/location.ts`: Consent‑aware location utilities (used later for map/geocoding follow‑ups).
- `src/services/PhotoUploadService.ts`: Uploads images (Cloudinary), supports resizing/quality.
- `project/features-updated-data-model/NOTES.md`: Canonical reference for App/Org JSON shapes and services.

## Architecture: Wizard + Data Model
- **Wizard flow** (stays inside Splash overlay):
  1. `new-org`: collect organization + organizer contact (first/last/email)
  2. `new-hunt`: collect hunt name, date, and location (city/state/zip)
  3. `new-steps`: define steps (stops) with hints and optional image per step
  4. `review-submit`: summary page; best‑effort persistence on submit
- **MVP handoff**: set `locationName` and `eventName` and navigate to Event page; persistence is added later.
- **Persistence (enhanced)**: write to App JSON and Org JSON (one per org) in blob storage using `OrgRegistryService`/`BlobService`.

## Data Model Mapping (Org JSON)
- Hunt object additions:
  - `location`: `{ city: string, state: string, zip: string }`
  - `rules`: rich markdown + acknowledgement (separate, already specified in NOTES)
  - `teams` (multi‑team model) or `teamCaptain`/`teamMembers` (single‑team model)
- Steps → Stops mapping:
  - `stops[]`: each step becomes `{ id, title, hints[], assets? }`
  - `id`: slugified `title` (ensure unique); regenerate on submit is acceptable for MVP
  - `assets`: optional images `{ coverUrl?, thumbnailUrl? }` (populated after upload in enhanced phase)
- App JSON:
  - Maintain `organizations[]` registry and `byDate[YYYY-MM-DD]` index when persisting hunts

## Integration Points
- **SplashScreen.tsx**
  - Extend internal state to store all wizard fields (org/contact, hunt, steps)
  - Add step components/branches: `new-org`, `new-hunt`, `new-steps`, `review-submit`
  - Validation: block Next until required fields are valid
  - Submit: MVP local handoff; enhanced persistence behind try/catch
- **App.jsx**
  - Continue to accept `locationName`, `eventName`, and optional `teamName` and navigate to `event`
- **EventService.ts**
  - Already capable of blob‑backed listing; keep mocks as fallback until data exists
- **Services** (added earlier or to be added)
  - `BlobService.ts`: read/write JSON with optimistic concurrency (etag/updatedAt)
  - `OrgRegistryService.ts`: load/upsert App/Org JSON and maintain `byDate` index

## Step‑By‑Step Implementation Plan (Phases)
- **Phase 1 (done/planned)**: Schemas & service scaffolds
  - Add Zod schemas for App/Org JSON
  - Add `BlobService` + `OrgRegistryService` (no UI changes)
- **Phase 2 (MVP)**: Wizard scaffold in `SplashScreen.tsx`
  - Steps `new-org` and `new-hunt` (name/date) with validation
  - Save → local handoff to Event page (no persistence)
- **Phase 5**: Hunt location fields (City/State/ZIP)
  - Add required fields to `new-hunt`; store in wizard state
- **Phase 6**: Steps & hints builder (+ optional image)
  - `new-steps`: dynamic steps list; per step: Title (required), Hints (1–3, ≥1 required), optional image with preview; reorder/remove
- **Phase 7**: Review & submit
  - `review-submit`: read‑only summary; confirm before persist
- **Phase 8**: Persistence & uploads (best‑effort)
  - On submit: upload step images (cover) and write Org/App JSON; always navigate to Event page; warn via toast on failures
- **Phase 9**: Tests & a11y polish
  - Unit/integration tests for wizard, persistence mocks, and error handling; keyboard operability; `aria-invalid` on inputs

See the dedicated prompts in this folder and in `project/features-updated-data-model/` for concrete task lists.

## Where to Be Careful (Complex Regions)
- **State & navigation handoff**
  - `SplashScreen.tsx` should maintain wizard state locally to avoid mid‑step global writes; only on final submit hand off to `App.jsx` and optionally persist
  - Ensure Back/Next does not clear data; guard against accidental unmounts
- **ID generation (stops)**
  - Slugify titles into unique IDs; if titles change, stop IDs can change (acceptable for MVP). For future edits, consider stable IDs or a diff strategy
- **Image upload timing**
  - Uploads happen at final submit; network failures must not block redirect
  - Use best‑effort: store URLs in `assets.coverUrl` if upload succeeds; otherwise leave as null
- **Blob writes & concurrency**
  - Always read `etag`/`updatedAt` and write with an expected version; on conflict, re‑fetch and retry once, otherwise warn and continue
- **Event listing source**
  - Keep `config.ENABLE_BLOB_EVENTS` default OFF until you have valid App/Org JSON; ensure mocks remain as the final fallback
- **Validation & a11y**
  - Apply basic rules: require org/contact fields, hunt name/date/location, steps with Title + ≥1 Hint
  - Use clear inline messages and `aria-invalid`; make reordering keyboard accessible (or provide simpler add/remove first)

## Testing Strategy
- **Wizard**
  - Validate per‑step forms and navigation; ensure data persists across steps
  - Simulate image selection and preview; verify clear action
- **Persistence (mocked)**
  - Mock `BlobService` to confirm App/Org JSON updates and `byDate` maintenance
  - Simulate etag conflict on write; ensure retry or graceful warning
- **EventService flag behavior**
  - With flag OFF, use mocks
  - With flag ON, return blob‑backed events (when data exists)
- **Rules rendering**
  - If rules present, markdown renders; if `acknowledgement.required`, acceptance state stores per session/team

## Rollout & Flags
- Keep new blob‑backed listing behind `config.ENABLE_BLOB_EVENTS`
- Keep wizard MVP local until persistence is verified
- Gradually seed App/Org JSON and test in dev before enabling blob path by default

## Open Questions / Future Enhancements
- Team model: single‑team per hunt vs multi‑team with `teams[]` (captain, members)
- Geocoding of hunt location (city/state/zip) to center the map automatically
- Advanced step requirements (min people in photo, captions, geofence radius)
- Moderation and scoring policies at the hunt level
- Admin editing flows (post‑creation updates to steps, reordering, asset changes)

---

For concrete task breakdowns, see:
- `project/features-new-adventure/phase-5-hunt-location-fields/`
- `project/features-new-adventure/phase-6-steps-and-hints-builder/`
- `project/features-updated-data-model/NOTES.md`

This README is the authoritative reference for engineering changes related to the New Adventure setup feature.
