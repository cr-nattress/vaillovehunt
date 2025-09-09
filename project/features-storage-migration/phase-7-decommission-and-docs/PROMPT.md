# Phase 7: Decommission Netlify Blobs + Documentation

Objective: remove dependency on Netlify Blobs after stability window; update docs/runbooks.

## Tasks
- Disable Blob reads after stability period; keep shadow writes off.
- Archive/export remaining Blob data; update billing and secrets.
- Update `docs/`, `STARTUP.md`, runbooks, and on-call playbooks.
- Post-migration review: cost, performance, pitfalls, follow-ups.

## Acceptance Criteria
- No code paths use Netlify Blobs for app data.
- Documentation reflects new architecture and ops.
