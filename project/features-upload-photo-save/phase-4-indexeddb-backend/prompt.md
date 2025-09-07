# Phase 4 — Optional IndexedDB Backend

Goal
- Store full-resolution photos in IndexedDB for scalability and avoid localStorage size limits.

Scope
- Add `src/features/upload/LocalPhotoStore.ts` with methods:
  - `save(stopId: string, blob: Blob): Promise<void>`
  - `load(stopId: string): Promise<Blob | null>`
  - `remove(stopId: string): Promise<void>`
- Update Save/Remove handlers to use IndexedDB instead of localStorage when available.
- Keep a small `dataUrl` thumbnail (optional) in progress for quick rendering.

Out of Scope
- Server sync.

Implementation Steps
- Implement `LocalPhotoStore` using IndexedDB (e.g., `idb` or plain API).
- Provide a tiny fallback (localStorage) if IndexedDB is unavailable.
- On load, if a Blob exists, create an object URL for display.

Acceptance Criteria
- Large photos can be saved and reloaded efficiently.
- The app remains responsive; no crashes due to storage limits.
- Fallback to localStorage works transparently if IndexedDB is not supported.
