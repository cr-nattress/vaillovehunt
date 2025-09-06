# Phase 3 — Data Fetching via React Query

Goal
- Reduce brittle manual fetch logic by adopting React Query for caching, retries, de-duping, and background refresh.

Scope
- Install and configure React Query provider at app root.
- Migrate read operations first:
  - Feed data
  - Photos by company/event
- Add simple mutations for safe writes (e.g., save settings) with optimistic updates only if trivial.

Out of Scope
- Complex upload mutations (handled in Phase 4).
- URL routing changes.

Implementation Steps
- Add `@tanstack/react-query`.
- Wrap the app with `QueryClientProvider` in `src/main.jsx` (or `src/App.jsx`), using a shared `queryClient` instance.
- Create typed hooks in `src/services/queries/`:
  - `useFeed()` → wraps `FeedService.get...`
  - `useCompanyEventPhotos(company, event)` → wraps `PhotoService.getPhotosByCompanyEvent`
- Replace direct service calls in components with these hooks; preserve existing UX states.
- Configure sensible `staleTime`, `retry`, and `refetchOnWindowFocus` per query.

Acceptance Criteria
- Read paths use React Query and preserve or improve UX.
- Duplicate mounts do not re-fetch; queries are cached.
- Automatic retries occur on transient failures.

Guardrails
- Keep existing error notifications (Phase 2) in place.
- Do not alter component props or signatures beyond replacing data sources with hooks.
