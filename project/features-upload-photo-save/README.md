# Features: Upload Photo (Local Preview & Save Only)

This track changes the photo flow so that selecting a picture shows a local preview on the page, and pressing Save stores it locally without contacting the server.

Phases
- Phase 1 — Preview State & Handlers (no server calls)
- Phase 2 — StopCard UI: Select → Preview → Save/Change/Cancel
- Phase 3 — Local Persistence (localStorage + optional resize)
- Phase 4 — Optional IndexedDB Backend
- Phase 5 — Accessibility & Mobile Capture
- Phase 6 — Tests (Unit + RTL Integration)
- Phase 7 — Cleanup & Docs

How to mark completion
- After finishing a phase and verifying behavior, append `-completed` to that phase folder.

Where to work
- UI: `src/features/app/StopCard.tsx` (or `src/features/app/stop-card/*` if refactored)
- Progress/state owner: `src/App.jsx` (or a small state slice)
- Optional: `src/features/upload/LocalPhotoStore.ts`, `src/features/upload/resizeImage.ts`
- No changes to `src/client/PhotoUploadService.ts` or server APIs for this feature.
