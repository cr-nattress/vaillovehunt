# Phase 4: Dual-Write and Read-Through Fallback

Objective: enable safe rollout by writing to both stores and reading from Azure with Blob fallback.

## Tasks
- Implement dual-write in service layer for upserts when `DUAL_WRITE_TO_AZURE=true`.
  - Order: Azure first, then Blob (or vice versa with metrics); log both outcomes.
- Implement read-through fallback when `READ_FROM_AZURE_FIRST=true`:
  - Try Azure; if miss/error, fallback to Blob.
  - Optional: opportunistic backfill on fallback hit.
- Add structured logs with correlation IDs and durations.

## Acceptance Criteria
- Feature flags toggle behavior without code changes.
- On read failures in Azure, Blob fallback serves data.
- Metrics/logs clearly indicate both paths.
