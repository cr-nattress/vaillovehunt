# Refactorings 03 — Challenges UI/UX (Safe, Incremental)

A sequence of small, focused phases to modernize the Challenges (Hunt) experience while minimizing breakage. Each phase is non-breaking and ends with a working app. When you finish a phase, rename that folder to append `-completed`.

Phases
- Phase 0 — StopCard Refactor (structure only)
- Phase 1 — Visual & IA Polish (Current/Completed)
- Phase 2 — Accessibility & Interactions (Tabs + Focus)
- Phase 3 — Feedback & Errors (Toasts + Inline Retry)
- Phase 4 — Performance & Polish (Lazy images, animations)
- Phase 5 — Mobile Footer (Event/Challenges/Social)
- Phase 6 — Tabs Keyboard Enhancements (WAI-ARIA)
- Phase 7 — Small Integration Tests (RTL)

Where to work
- `src/features/app/StopCard.tsx` and new subfolder `src/features/app/stop-card/`
- `src/features/app/CompletedAccordion.tsx`
- `src/features/app/StopsList.tsx`
- `src/features/app/Header.tsx`
- `src/App.jsx`
