# Phase 4 Prompt: Persist New Org and Hunt to KV

Enhance the MVP by saving newly created org and event to Netlify KV using existing serverless functions. Keep UX identical to Phase 3; persistence is additive.

Tasks:
1) Generate slugs:
   - `orgSlug = slugify(orgName)` (lowercase, spaces→`-`, remove non-alphanumerics)
   - `dateStr = YYYY-MM-DD` from the hunt date field
2) Upsert records via `/.netlify/functions/kv-upsert`:
   - Key: `orgs/${orgSlug}.json` → `{ orgName, contact: { firstName, lastName, email }, createdAt }`
   - Key: `events/${dateStr}/${orgSlug}.json` → `{ orgName, eventName: huntName, startAt: dateStr, endAt: dateStr, createdAt }`
3) Use `apiClient.post` or `apiClient.request` to call the function with JSON body (no FormData required).
4) On failure:
   - Log the error and show a toast warning, but allow navigation to continue (non-blocking in MVP).
5) (Optional) Add a feature flag/env to choose between KV-backed events vs mock `EventService` list.

Validation:
- Create a new adventure → Save → inspect function logs and verify KV contains both keys.
- If KV-backed list is enabled, the new event should appear in Today’s events list.
- Errors surface as toasts but do not block redirect.
