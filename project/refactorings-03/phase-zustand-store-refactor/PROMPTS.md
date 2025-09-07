# Prompts and Checklists for Each Phase

These prompts are designed for code reviews, pair programming, or AI-assisted refactors. Copy/paste them as-is to guide each phase.

---

## Phase 1 — Navigation Store

Prompt:

```
Goal: Extract navigation state/actions from src/store/appStore.ts into a dedicated store.

Tasks:
1) Create src/store/navigation.store.ts with:
   - State: currentPage: 'hunt' | 'feed' | 'event', taskTab: 'current' | 'completed'
   - Actions: navigate(page), setTaskTab(tab)
   - persist with name: 'nav-store'
2) Replace imports in components that read navigation to use useNavigationStore.
3) Remove navigation state/actions from appStore.ts, including from its persist partialize configuration.
4) Verify FooterNav and tab switching still function.

Acceptance Criteria:
- Build passes. Footer navigation and tabs work.
- No references to navigation fields remain in appStore.ts.

Rollback Plan:
- Revert the new store file and imports.
- Re-add navigation fields/actions to appStore.ts.
```

Checklist:
- [ ] nav-store created and persisted
- [ ] components switched to useNavigationStore
- [ ] appStore.ts cleaned up
- [ ] manual QA on hunt/feed/event navigation

---

## Phase 2 — Event Store

Prompt:

```
Goal: Extract event identity and UI intent flags into a dedicated store.

Tasks:
1) Create src/store/event.store.ts with:
   - State: locationName, eventName, teamName, lockedByQuery, openEventSettingsOnce
   - Actions: setLocationName, setEventName, setTeamName, setLockedByQuery, requestOpenEventSettings, clearOpenEventSettings
   - persist with name: 'event-store'
2) Update App.jsx and EventPage.tsx (and Splash) to read from useEventStore.
3) Remove these fields/actions from appStore.ts.

Acceptance Criteria:
- Splash selection and "Set up new event" flow still operate.
- EventPage auto-opens settings when the one-time flag is set.

Rollback Plan:
- Revert imports/usage and restore in appStore.ts.
```

Checklist:
- [ ] event-store created and persisted
- [ ] App and EventPage wired to event store
- [ ] appStore.ts cleaned up
- [ ] manual QA on splash -> event settings flow

---

## Phase 3 — Progress Store

Prompt:

```
Goal: Extract progress state and preview helpers.

Tasks:
1) Create src/store/progress.store.ts with:
   - State: progress: Record<string, StopProgress>
   - Actions: setProgress, updateStopProgress, resetProgress, selectPhoto, cancelPreview, hydratePreviewsFromStorage (if needed)
   - persist with name: 'progress-store' (or skip persistence if large)
2) Update all consumers (StopsList, upload flows) to use useProgressStore.
3) Remove these fields/actions from appStore.ts.

Acceptance Criteria:
- Uploads update progress; reset clears only progress.

Rollback Plan:
- Revert imports/usage and restore in appStore.ts.
```

Checklist:
- [ ] progress-store created
- [ ] consumers updated
- [ ] appStore.ts cleaned up
- [ ] manual QA: upload + reset

---

## Phase 4 — Photos Store

Prompt:

```
Goal: Extract teamPhotos and related actions.

Tasks:
1) Create src/store/photos.store.ts with:
   - State: teamPhotos: Record<org, Record<event, Record<team, PhotoRecord[]>>>
   - Actions: saveTeamPhoto, getTeamPhotos, clearTeamPhotos, clearAllTeamData, switchTeam
   - persist with name: 'photos-store'
2) Update all consumers.
3) Consider moving cross-domain orchestration (e.g., switchTeam affects progress) into services.
4) Remove these fields/actions from appStore.ts.

Acceptance Criteria:
- Uploads still save; switchTeam behavior intact.

Rollback Plan:
- Revert imports/usage and restore in appStore.ts.
```

Checklist:
- [ ] photos-store created
- [ ] consumers updated
- [ ] appStore.ts cleaned up
- [ ] manual QA: upload + switchTeam

---

## Phase 5 — Session Store (Optional)

Prompt:

```
Goal: Extract session state.

Tasks:
1) Create src/store/session.store.ts with:
   - State: sessionId
   - Actions: setSessionId
   - persist with name: 'session-store'
2) Update consumers.
3) Remove from appStore.ts.
```

Checklist:
- [ ] session-store created
- [ ] consumers updated
- [ ] appStore.ts cleaned up

---

## Phase 6 — Cleanup, Migrations, and Perf

Prompt:

```
Goal: finalize refactor with persistence and perf hygiene.

Tasks:
1) Ensure each store has versioning and, if needed, migrate.
2) Use partialize to persist minimal state.
3) Replace broad selectors with narrow selectors; use shallow where reasonable.
4) Remove verbose logs or guard them with NODE_ENV.
```

Checklist:
- [ ] version/migrate set
- [ ] partialize set
- [ ] selectors reviewed
- [ ] logs trimmed
