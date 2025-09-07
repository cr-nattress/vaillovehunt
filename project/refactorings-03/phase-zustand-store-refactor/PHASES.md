# Zustand Store Refactor — Phases

This plan splits `src/store/appStore.ts` into smaller stores/slices with minimal risk. Each phase has goals, steps, acceptance criteria, and rollback guidance.

We present two tracks:
- Track A: Multiple Stores by Domain
- Track B: Single Store Composed of Slices

Pick one track; both have the same phases. Track A defaults below. Track B notes are inline where different.

---

## Phase 0 — Inventory and Baseline (read-only)

- Goals
  - Catalog state and actions in `src/store/appStore.ts`.
  - Note which components subscribe to which fields/actions.
- Steps
  - List domains: Navigation, Event Identity, Session, Progress, Photos, UI Intents.
  - Grep usages in `src/**/*.tsx?` and `src/**/*.jsx?`.
- Acceptance Criteria
  - A table/list of store keys and consumer files is recorded in PR description or notes.
- Rollback
  - No code changes.

---

## Phase 1 — Extract Navigation Store

- Goals
  - Move `currentPage`, `taskTab`, `navigate`, `setTaskTab` out of `appStore`.
- Steps
  - Create `src/store/navigation.store.ts` with persisted state using `zustand` + `persist`.
  - Update components that read navigation to import from `useNavigationStore`.
  - Remove navigation state/actions from `appStore` and from its `partialize`.
- Acceptance Criteria
  - App compiles; page changes work (hunt/feed/event).
  - No regressions in footer navigation and tab switching.
- Rollback
  - Revert imports in components and re-add fields/actions in `appStore`.

- Track B (Slices)
  - Instead, create `src/store/slices/navigation.slice.ts` and compose in a new `createAppStore.ts`.

---

## Phase 2 — Extract Event Store

- Goals
  - Move `locationName`, `eventName`, `teamName`, `lockedByQuery`, `openEventSettingsOnce`, `requestOpenEventSettings`, `clearOpenEventSettings` to `event.store.ts`.
- Steps
  - Create `src/store/event.store.ts` and migrate usages (`App.jsx`, `EventPage.tsx`, splash).
  - Keep URL-parsing logic in components for now; it writes into `event.store.ts`.
  - Remove these fields/actions from `appStore`.
- Acceptance Criteria
  - Splash screen still sets/reads organization and event.
  - Event page auto-opens settings via the one-time flag.
- Rollback
  - Revert imports and re-add to `appStore`.

- Track B (Slices)
  - Create `event.slice.ts` and compose in `createAppStore.ts`.

---

## Phase 3 — Extract Progress Store

- Goals
  - Move `progress`, `setProgress`, `updateStopProgress`, `resetProgress`, `selectPhoto`, `cancelPreview`, `hydratePreviewsFromStorage`.
- Steps
  - Create `src/store/progress.store.ts` (or `progress.slice.ts`).
  - Update `StopsList`, upload flows, and any tests to read from the new store.
- Acceptance Criteria
  - Uploads still update stop progress and preview behavior.
  - Reset clears progress only.
- Rollback
  - Revert imports and re-add to `appStore`.

---

## Phase 4 — Extract Photos Store

- Goals
  - Move `teamPhotos`, `saveTeamPhoto`, `getTeamPhotos`, `clearTeamPhotos`, `clearAllTeamData`, `switchTeam`.
- Steps
  - Create `src/store/photos.store.ts`.
  - Update `PhotoUploadService` consumers and any place reading team photos.
  - Consider moving cross-domain orchestration (e.g., switchTeam impacts progress) into a thin service.
- Acceptance Criteria
  - Uploads still save to store, and `switchTeam` loads progress from photos or via a service.
- Rollback
  - Revert imports and re-add to `appStore`.

---

## Phase 5 — Session Store (optional)

- Goals
  - Move `sessionId` into `session.store.ts` and centralize session concerns.
- Steps
  - Create minimal store and update readers.
- Acceptance Criteria
  - Session ID available where needed; no regressions in uploads/analytics.
- Rollback
  - Revert imports and re-add to `appStore`.

---

## Phase 6 — Cleanups and Migrations

- Goals
  - Remove any dead code in `appStore.ts`; delete the file if fully migrated, or convert it to slice-composer.
  - Improve `persist` configs: versioning, `partialize`, migrations.
  - Add `shallow` selectors at call sites to reduce re-renders.
- Steps
  - Audit selectors; replace broad selectors with narrow ones.
  - Add store-level versions and migrate functions if persisted shapes changed.
- Acceptance Criteria
  - Builds clean, tests pass, reduced re-render hotspots verified.
- Rollback
  - Revert config changes.

---

## Phase 7 — Tests and Docs

- Goals
  - Add unit tests per store.
  - Document public API of each store and cross-store services.
- Steps
  - Snapshot tests for reducers/actions.
  - README in `src/store/` summarizing domains.
- Acceptance Criteria
  - Tests cover critical actions and migrations.
  - Developer docs explain how to add a new domain.

---

## Notes on Persistence and Migration

- Prefer per-store `persist` with its own storage key for Track A.
- For Track B, use a single `persist` with `partialize` grouped by slice.
- Use `version` and `migrate` to evolve shapes safely.

## Observability

- Consider logging middleware during refactor to trace state changes.
- Remove verbose logs post-refactor.
