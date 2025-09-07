# Phase 2 — StopCard UI: Select → Preview → Save/Change/Cancel

Goal
- Update `StopCard` UI to support a local-only review flow: select a photo, preview it, then save locally or change/cancel.

Scope
- In `src/features/app/StopCard.tsx` (or `stop-card/StopCardActions.tsx` if refactored):
  - No-selection state: show primary “Select Photo” button.
  - Preview state: show preview image with buttons: “Save locally” (primary), “Change Photo” (secondary), “Cancel” (link).
  - SavedLocal state: show thumbnail + caption “Saved locally” and actions “Change Photo” and “Remove”.
- Keep server calls disabled for this flow; this is local-only.

Out of Scope
- Persistence implementation details (Phase 3) and IndexedDB backend (Phase 4).

Implementation Steps
- Drive states from `progress[stopId].preview` fields.
- Wire file input `onChange` to `handleSelectPhoto` handler from Phase 1.
- Implement buttons that call `handleSavePhotoLocal`, `handleChangePhoto`, `handleCancelPreview` (handlers stubbed for now).
- Ensure image preview uses `objectUrl` (fallback to `dataUrl` when present).
- Maintain existing aria labels and keyboard accessibility.

Acceptance Criteria
- Selecting a photo switches UI to Preview state and shows the image inline.
- Save button does not contact the server in this phase.
- Change/Cancel transitions work and do not leak object URLs.
