# Features: Remove Hash Routing and Use Zustand for Navigation

This track replaces hash-based routing with a centralized navigation state in the existing Zustand store. The goal is to keep navigation and UI state in one place, simplify deep-linking decisions, and reduce URL noise.

Phases
- Phase 1 — Add Navigation Slice to Store (Mirror Mode)
- Phase 2 — App Consumes Store Navigation
- Phase 3 — Remove Hash Sync (URL Decoupling)
- Phase 4 — Update Header and Navigation Callers
- Phase 5 — History & Persistence (Back/Forward, Local Persistence)
- Phase 6 — Cleanup, Docs, and Guardrails

Marking Completion
- After completing each phase, rename the corresponding folder to add `-completed`.

Primary Files Involved
- `src/store/appStore.ts` (or wherever `useAppStore` is defined)
- `src/App.jsx`
- `src/features/app/Header.tsx`
- `src/hooks/useHashRouter.ts` (to be deprecated and removed)

Notes
- Start with a non-breaking “mirror mode” where store state mirrors the current hash state to avoid regressions.
- Consider whether you still want any URL representation for shareability; you can add that back later (Phase 5) with optional, clean URLs.
