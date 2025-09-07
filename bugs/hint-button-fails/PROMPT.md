6) __Visibility/Styling corrections__
   - Verify that `StopCardHints.tsx` sets `animation` with `forwards` and that corresponding keyframes exist for `slideInFromLeft`.
   - Ensure revealed hints do not remain at `opacity: 0` after animation:
     - Either keep `animation-fill-mode: forwards` or set `opacity: 1` when `state.revealedHints` increases.
   - Confirm no `hidden` attribute or `display: none` on the hints container for the active stop.
   - Check color contrast: hint text color vs. background; ensure it is not effectively invisible.
   - Inspect for clipping: container `overflow: hidden` combined with transform may hide content; adjust container height/overflow as needed.

# Bug: Hint button does not reveal additional hints on Challenges page

## Summary
Clicking the "Hint" button on the Challenges (Hunt) page should reveal the next hint, but nothing appears to happen. The UI logs confirm the click handler runs, yet the number of visible hints does not increase.

## Reproduction
- Open the app and navigate to the Challenges (Hunt) page.
- Locate the current active stop card.
- Click the "💡 Hint {N}" button.
- Expected: The next hint becomes visible under that stop.
- Actual: The visible hints remain unchanged.

## Code Map and Tracing
- `src/features/app/StopsList.tsx`
  - Renders the current active stop(s).
  - Defines `handleRevealNextHint(stopId)` which:
    - Reads current state: `const currentState = progress[stopId] || { done: false, notes: '', photo: null, revealedHints: 1 }`
    - Validates against stop.hints length.
    - Calls `updateStopProgress(stopId, nextState)` with `revealedHints + 1`.
  - Wires StopCard prop: `revealNextHint={() => handleRevealNextHint(s.id)}`.

- `src/features/app/stop-card/StopCard.tsx`
  - Uses `useStopCardState()` to read per-stop progress derived from the `progress` prop.
  - Renders header via `StopCardHeader` and the hints list via `StopCardHints`.

- `src/features/app/stop-card/StopCardHeader.tsx`
  - Displays the "Hint" button when `(!state.done || expanded) && state.revealedHints < totalHints`.
  - On click: stops propagation, prevents default, calls `onRevealNextHint()`.
  - Logs: `🔘 HINT BUTTON CLICKED`.

- `src/features/app/stop-card/StopCardHints.tsx`
  - Displays `stop.hints.slice(0, state.revealedHints)`.
  - Logs: `💡 HINTS SECTION: ... hintsToShow=<count>`.

- `src/store/progress.store.ts`
  - Exposes `updateStopProgress(stopId, progressData)` which immutably updates `progress[stopId]` inside a persisted Zustand store.

- `src/App.jsx`
  - Subscribes to `useProgressStore()` and passes `progress` as a prop to `StopsList`.

## Observed Behavior
- The click handler fires (console shows `🔘 HINT BUTTON CLICKED`).
- `handleRevealNextHint` runs and calls `updateStopProgress`.
- However, the number of visible hints does not increase.
- IMPORTANT: The new hint elements DO get added to the DOM, but they are not visible in the browser — pointing to a styling/animation visibility issue (e.g., `opacity: 0`, `display: none`, clipped/overflow, z-index, or color-on-color).

## Root Cause Hypotheses
- __[stale_prop_progress]__ The `progress` object is passed from `App.jsx` down into `StopsList` and then into `StopCard`. If any parent’s render path lags or memoization holds onto old references, `useStopCardState` may compute from stale `progress` prop and not see the update.
- __[reset_side_effect]__ After hint update, another effect (like the team switch effect in `App.jsx`) might run, resetting `progress` based on team photos and setting `revealedHints` back to `1`, masking the update.
- __[instance_mismatch]__ If multiple instances of `useProgressStore` were created or mixed imports exist, `updateStopProgress` might update a different store instance than the one used by `App.jsx`. (Less likely, but verify there is only one `useProgressStore` definition and consistent imports.)
 - __[visibility_toggle_logic]__ Check if logic that toggles visibility is broken. For example, conditions like `(!state.done || expanded)` gating the hints section or `hidden` attribute on the hints container might be stuck in the wrong state, preventing revealed hints from being shown even though they are in the DOM.

## Logs that help confirm
- From `StopCardHeader.tsx`:
  - `🔘 HINT BUTTON CLICKED: stopId=...` on click.
- From `StopsList.tsx`:
  - `🔍 REVEAL HINT FUNCTION: stopId=...`
  - `🔍 Current state: { revealedHints: N }`
  - `🔍 REVEALING HINT: N -> N+1`
- From `StopCardHints.tsx` or `useStopCardState.ts`:
  - `💡 HINTS SECTION: ... hintsToShow=<count>`
  - After click, this count should increment.

## Fix Plan (preferred, minimal risk)
1) __Use selector-based subscription close to where the data is consumed__
   - Instead of passing the entire `progress` map from `App.jsx` into `StopsList` and then into `StopCard`, subscribe directly to the specific stop’s progress within `StopCard` (or `StopCardHints`) using a selector.
   - Example in `StopCard.tsx` (modular):
   ```tsx
   import { useProgressStore } from '../../store/progress.store'
   
   const stopProgress = useProgressStore(s => s.progress[stop.id])
   const state = stopProgress || { done: false, notes: '', photo: null, revealedHints: 1 }
   ```
   - Then remove the large `progress` prop threading for reading, but keep actions via props or direct store.
   - This ensures the component re-renders when the store slice for that stop changes, eliminating stale prop issues.

2) __Keep hint update in `StopsList` (OK) or move it to header (optional)__
   - Keeping `handleRevealNextHint` in `StopsList` is fine if the view subscribes to store updates directly.
   - Optionally, call `useProgressStore.getState().updateStopProgress(stopId, nextState)` directly inside `StopCardHeader` for a contained flow, but this couples UI and store.

3) __Guard against resets from other effects__
   - In `App.jsx`, the team switch effect rebuilds `progress` from team photos, setting `revealedHints: 1` for entries. Confirm it’s not firing inadvertently after hint clicks (check its dependencies: `teamName, locationName, eventName`).
   - If needed, debounce or skip rebuild when only `revealedHints` changed.

4) __Add post-update verification logs__
   - Immediately after `updateStopProgress`, log `useProgressStore.getState().progress[stopId]` to confirm the new `revealedHints` value is in the store.

5) __Add a regression test__
   - In `src/features/app/__tests__/StopCard.integration.test.tsx`, simulate clicking the hint button and assert the number of rendered hints increments.

## Concrete Changes to Apply
- __[A]__ Modify `src/features/app/stop-card/StopCard.tsx` to subscribe to the per-stop progress slice (or similarly in `StopCardHints.tsx`).
- __[B]__ Leave `handleRevealNextHint` in `StopsList.tsx` but add a one-line verification log post-update.
- __[C]__ Verify the team switch effect in `App.jsx` is not running upon hint click; if it is, guard it or restructure so it doesn’t reset `revealedHints`.
 - __[D]__ Visibility fixes in `src/features/app/stop-card/StopCardHints.tsx`:
   - Ensure the hint item style includes `animation-fill-mode: forwards` (or keep `forwards` in the `animation` shorthand) and remove lingering `opacity: 0` after animation completes.
   - Optionally, set `opacity: 1` directly based on `state.revealedHints` for currently revealed items to avoid animation timing issues.
   - Validate that the hints wrapper is rendered (not `hidden`) whenever `(!state.done || expanded)` is true.
 - __[E]__ Verify toggle logic paths:
   - Confirm `StopCardHints` and any parent containers are not using `hidden={...}` or conditional rendering that remains false after reveal.
   - Ensure the hint button’s `onRevealNextHint` ultimately causes a re-render of the component that governs the show/hide condition.

## Acceptance Criteria
- Clicking the Hint button increases the visible hint count for the active stop.
- The button hides once all hints are revealed.
- No regression to upload/transition logic.
- No unintended resets of `revealedHints` when staying on the same team/location/event.

## Suggested Prompt to Execute This Fix
"""
You are fixing a bug where the Hint button does not reveal additional hints.

Tasks:
1) In `src/features/app/stop-card/StopCard.tsx`, subscribe to the per-stop progress using `useProgressStore(s => s.progress[stop.id])` and use it as the `state` instead of reading from the `progress` prop. Keep a default `{ done:false, notes:'', photo:null, revealedHints:1 }` when absent.
2) Ensure `StopCardHints.tsx` displays `stop.hints.slice(0, state.revealedHints)` based on that store-sourced `state`.
3) Keep `handleRevealNextHint` in `src/features/app/StopsList.tsx`, but after calling `updateStopProgress`, log `useProgressStore.getState().progress[stopId]` to verify the increment.
4) Confirm the team-switch effect in `src/App.jsx` doesn’t run on hint clicks. If it does, add a guard or debounce so it does not rebuild `progress` when only hint counts change.
5) Add an integration test that renders a stop with 3 hints, clicks the Hint button twice, and asserts the visible hints count increments from 1 -> 2 -> 3.
6) Additionally, validate visibility: assert the DOM nodes for newly revealed hints exist and have computed styles that make them visible (e.g., `opacity: 1`, not `display: none`). If animations are used, ensure `animation-fill-mode: forwards` is applied or final styles set explicitly.

Validation:
- Run the app; from the Challenges page, click Hint and verify a new hint appears.
- Confirm the button hides after the last hint.
- Confirm no console errors and no regression to upload/transition behavior.
 - Inspect the DOM: verify newly added hint nodes are visible (not clipped/transparent/behind overlay).
"""
