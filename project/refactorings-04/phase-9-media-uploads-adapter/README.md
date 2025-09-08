# Phase 9: Media Uploads Adapter Boundary

Goal: Introduce a media adapter boundary that supports pluggable providers (e.g., Cloudinary) for images and video, keeping UI decoupled from provider details.

Reference: `project/refactorings-04/plan.md`, `project/features-new-adventure/phase-8-persistence-and-uploads/README.md`

## Tasks
- Implement `media.port.ts` with typed signatures for `uploadImage` and `uploadVideo` (progress callbacks, limits, tags/folders).
- Add a `src/infra/media/cloudinary.adapter.ts` implementing the port using a signing function (Netlify) and provider SDK or HTTP.
- Ensure folder/tag conventions and size/format limits are centralized in the adapter.
- Provide a noop/mock adapter for tests and dev.

## Acceptance Criteria
- App compiles; no runtime switch yet unless gated by a feature flag.
- The adapter abstraction exists and can be unit tested in isolation.
- `STATUS.md` updated after review.
