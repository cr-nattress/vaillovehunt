# Phase 0 — StopCard Refactor (structure only)

Goal
- Reduce fragility by decomposing `src/features/app/StopCard.tsx` into small, testable components and hooks without changing behavior or props.

Scope
- Create `src/features/app/stop-card/` and move logic/markup into:
  - `StopCard.tsx` (thin shell that composes subcomponents)
  - `StopCardHeader.tsx` (number/check + title + chevron)
  - `StopCardHints.tsx` (hint stepper and revealed hints)
  - `StopCardMedia.tsx` (photo/placeholder rendering)
  - `StopCardActions.tsx` (upload CTA + file input wiring)
  - `StopCardCompletedMeta.tsx` (fun fact + completion meta)
  - `useStopCardState.ts` (memos for state, uploading/transition flags)
  - `stopCard.tokens.ts` (constants for sizes/animations/colors)
- Keep public `StopCardProps` unchanged and exported from `stop-card/StopCard.tsx`.
- Update `src/features/app/StopsList.tsx` to import from `stop-card/StopCard` (no prop changes).

Out of Scope
- No visual/UX changes, no new texts, no aria changes.

Implementation Steps
- Copy current `StopCard.tsx` to `stop-card/StopCard.tsx` and begin extracting subcomponents.
- Move non-UI logic (memos, handlers) into `useStopCardState.ts`.
- Replace inline constants with `stopCard.tokens.ts` (reusing CSS variables).
- Replace imports in `StopsList.tsx`.

Acceptance Criteria
- UI before/after is visually and behaviorally identical.
- `StopCardProps` contract remains unchanged.
- Minimal RTL tests for header/hints/actions render as expected given props.

Guardrails
- Do not change aria labels, timing, or transitions.
- Keep file input `id/label` wiring intact.
