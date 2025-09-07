# Phase 3 — Local Persistence (localStorage + Optional Resize)

Goal
- Persist the saved photo locally so it survives reloads, without sending any data to the server.

Scope
- Use `localStorage` to store a `dataUrl` representation of the selected image under `progress[stopId].preview.dataUrl`.
- Add a small `resizeImage(file, maxWidth, maxHeight, quality)` helper to reduce size before save.
- Update handlers:
  - `handleSavePhotoLocal(stopId)` converts selected File to dataUrl (optionally via resize) and saves to progress, sets `savedLocally=true`.
  - `handleRemovePhotoLocal(stopId)` clears preview from progress and revokes any object URLs.

Out of Scope
- IndexedDB storage backend (Phase 4).

Implementation Steps
- Implement `resizeImage.ts` (canvas-based) under `src/features/upload/`.
- In `App.jsx`, implement `handleSavePhotoLocal` and `handleRemovePhotoLocal`.
- On app load, if `dataUrl` exists, show it in `StopCard` (and create a fresh object URL only if needed).

Acceptance Criteria
- Saved photos persist across reloads and appear in `StopCard`.
- Large images are resized to manageable sizes before saving.
- No server calls are made during select or save.
