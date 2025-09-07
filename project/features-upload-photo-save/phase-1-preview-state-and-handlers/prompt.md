# Phase 1 — Preview State & Handlers (No Server Calls)

Goal
- Add local preview state and handlers so selecting a photo shows it on the page immediately with zero network traffic.

Scope
- Extend per-stop progress with a `preview` object: `{ objectUrl?: string, dataUrl?: string, fileMeta?: { name; type; size }, savedLocally: boolean, savedAt?: number }`.
- Add handlers in `src/App.jsx` (or a small helper) to manage preview lifecycle:
  - `handleSelectPhoto(stopId, file)` → create object URL and store in `progress[stopId].preview`.
  - `handleCancelPreview(stopId)` → revoke object URL and clear preview state.
- Do not call `PhotoUploadService` or any server API in this phase.

Out of Scope
- Save/Change/Cancel UI and local persistence (Phase 2/3).

Implementation Steps
- Update `progress` shape and ensure it propagates to `StopCard` via `StopsList`.
- In `StopCard`, if `preview.objectUrl` exists, render it as the current image.
- Add a hidden `<input type="file" accept="image/*" capture="environment">` and wire to `handleSelectPhoto`.

Acceptance Criteria
- Selecting an image displays it immediately on the card.
- No network calls occur on select.
- Clearing or navigating away revokes the object URL to avoid leaks.
