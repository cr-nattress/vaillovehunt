# Phase 6: Production Cutover + Shadow Writes

Objective: safely switch production reads to Azure, keep shadow writes to Blob for rollback.

## Tasks
- Enable `DUAL_WRITE_TO_AZURE` in production.
- Roll out `READ_FROM_AZURE_FIRST` gradually (e.g., canary instances or percentage-based flag).
- Monitor error rates, latency, throttling; define rollback triggers.
- Keep shadow writes to Blob for 24–72 hours post cutover.

## Acceptance Criteria
- No customer-facing regressions during cutover.
- Rollback can be enacted by flags within minutes.
