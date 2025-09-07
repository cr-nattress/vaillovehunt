# Bug Fix Plan: [Short, specific title]

This template is intended to be used AFTER completing `BUG_DIAGNOSTIC_TEMPLATE.md`. It consumes those findings to produce a careful, incremental change plan and verification steps.

## Inputs From Diagnostic
- Bug file: `[link/path to BUG_DIAGNOSTIC_TEMPLATE.md]`
- Root Cause (from Diagnostic):
  - [One-line causal statement]
- Evidence (briefly cite):
  - DOM: [summary]
  - Store: [summary]
  - Logs: [summary]
  - Network: [summary]
  - Tests: [summary]
- Confirmed Hypotheses: `[x] hypothesis-a`, `[x] hypothesis-b`
- Rejected Hypotheses: `[ ] hypothesis-c`, `[ ] hypothesis-d`

## Risk & Complexity Assessment
- Complexity: Trivial / Low / Medium / High / Critical blocker
- Risk factors:
  - [Cross-module impact? Store/effects? Network? CSS/animations?]
- Rollback strategy:
  - [How to quickly revert if regression is observed]

## Fix Strategy (High-Level)
- Objective: [What we will change and why it resolves the root cause]
- Constraints:
  - [Minimal blast radius, preserve state, avoid regressions]
- Acceptance Criteria:
  - [Measurable success conditions tying back to the symptom]

## Proposed Changes (Incremental)
For each step, specify the change, reason, validation, and rollback.

1) Change 1
   - Files/locations:
     - `path/to/file#symbol` (e.g., `src/features/app/stop-card/StopCardHints.tsx`)
   - Edit summary:
     - [Exact change, e.g., use selector-based subscription / set explicit opacity]
   - Why:
     - [Ties to root cause]
   - Validation:
     - [Manual check, console log expectations, DOM assertion]
   - Rollback:
     - [How to revert this specific step]

2) Change 2
   - Files/locations: [...]
   - Edit summary: [...]
   - Why: [...]
   - Validation: [...]
   - Rollback: [...]

3) Change 3 (optional)
   - Files/locations: [...]
   - Edit summary: [...]
   - Why: [...]
   - Validation: [...]
   - Rollback: [...]

## Instrumentation & Logging (Temporary)
- Add temporary logs around:
  - [Before/after store updates]
  - [Branching conditions controlling visibility]
  - [Network results]
- Removal plan:
  - [Delete logs after verification and commit clean]

## Test Plan
- Unit/Integration tests to add/update:
  - [Test name 1]: [action] → [assertion]
  - [Test name 2]: [action] → [assertion]
- Edge cases:
  - [Edge case 1]
  - [Edge case 2]
- Animation/CSS visibility (if applicable):
  - [Assert computed styles or use final explicit styles during tests]

## Stepwise Verification Checklist
- After Step 1
  - [ ] Symptom improved/removed in scenario A
  - [ ] Logs show expected new state/branching
- After Step 2
  - [ ] Behavior consistent across pages/routes
  - [ ] No unexpected state resets
- After Step 3
  - [ ] All acceptance criteria met
  - [ ] No console errors/warnings

## Deployment Considerations
- Environment variables:
  - [List vars changed or required]
- Feature flags/toggles:
  - [List flags]
- Rollout approach:
  - [Local → staging → production]
- Monitoring after rollout:
  - [Console/network logs; user reports; error trackers]

## Post-Fix Actions
- Remove temporary instrumentation
- Update documentation (if any)
- Create regression tests (if not already added)
- Close or link the bug report

## Final Result Summary
- Changes applied:
  - [List of PRs/commits or summary of edits]
- Verification outcome:
  - [Manual QA + test results]
- Remaining risks / follow-ups:
  - [Any optional improvements or backlog items]
