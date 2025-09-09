# Phase 5: Staging Backfill and Parity Validation

Objective: validate data parity and performance in staging before production cutover.

## Tasks
- Run migration tool in staging against real data.
- Add parity checker script:
  - Sample N orgs; compare Azure Orgs JSON vs Blob org JSON (ignore timestamp fields).
  - Verify HuntIndex counts match `app.byDate` entries.
- Add integration/load tests for `listToday` and basic CRUD with ETag conflict scenarios.

## Acceptance Criteria
- Parity checker passes within agreed thresholds.
- Latency and error rates in staging meet SLOs.
