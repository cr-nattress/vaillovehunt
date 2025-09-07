# Bug: Photo upload button does not upload or save

## Summary
Clicking "Upload Photo" (and then "Save Photo" after preview) should upload an image for the active stop and persist it (Cloudinary public URL + local team storage). Currently, no upload appears to occur and the stop never transitions to completed.

## Reproduction
- Go to the Challenges (Hunt) page.
- For the active stop, click "Upload Photo" and select an image.
- A preview appears (if preview pipeline is active). Click "Save Photo".
- Expected:
  - Network request to `/.netlify/functions/photo-upload` or `http://localhost:3002/api/photo-upload` (dev server) succeeds with JSON `{ photoUrl, publicId, ... }`.
  - Store updates: `progress[stopId].photo` set to uploaded URL; stop transitions to done.
- Actual:
  - No successful upload; stop remains uncompleted; possibly no network call or an error is swallowed.

## Code Map
- UI entry point: `src/features/app/stop-card/StopCardActions.tsx`
  - File input `onChange` triggers `selectPhoto(stop.id, file)` to set preview in progress store.
  - "Save Photo" button calls `handlePhotoUpload(selectedFile)` which calls `onUpload(stop.id, file)` from props.
- Upload handler wiring: `src/App.jsx`
  - `handlePhotoUpload(stopId, file)`
    - Checks for existing photo.
    - Calls `PhotoUploadService.uploadPhotoWithResize(file, stop.title, sessionId, 1600, 0.8, teamName, locationName, eventName)`.
    - On success, saves record to Zustand (`saveTeamPhoto`) and API (`PhotoService.saveTeamPhoto`), then `updateStopProgress` to mark done with photo URL.
- Client upload service: `src/client/PhotoUploadService.ts`
  - `uploadPhotoWithResize()` resizes then calls `uploadPhoto()`.
  - `uploadPhoto()` uses `apiClient.requestFormData('/photo-upload', formData, { timeout: 60000, retryAttempts: 2 })`.
- API base resolution: `src/services/apiClient.ts`
  - If `VITE_API_URL` set → uses it directly.
  - If `window.location.port === '8888'` (Netlify dev) → uses `'/.netlify/functions'`.
  - If production (hostname != 'localhost') → uses `'/.netlify/functions'`.
  - Else development → uses `'http://localhost:3002/api'`.
- Serverless upload function: `netlify/functions/photo-upload.ts`
  - Expects multipart/form-data with field `photo` and metadata fields.
  - Requires env `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
  - Returns `{ photoUrl, publicId, locationSlug, title, uploadedAt }`.

## Root Cause Hypotheses
- __[missing_env]__ Cloudinary env variables are missing locally or in Netlify, causing 500 (function logs: "Missing Cloudinary environment variables").
- __[wrong_base_url]__ In local dev (vite only), `apiClient` points to `http://localhost:3002/api/photo-upload`. If the local Express API is not running or does not implement `/api/photo-upload`, requests will fail. In this case you must run `npm run start` or `npm run start:netlify` to use functions.
- __[netlify_dev_not_running]__ If using Netlify Functions path `/.netlify/functions/photo-upload`, you must run `netlify dev` so the function is available at that path.
- __[CORS_or_content_type]__ Uploads require `multipart/form-data`. `apiClient.requestFormData` correctly avoids setting Content-Type and lets the browser supply the boundary; but a custom header elsewhere could break it. Verify network request headers.
- __[error_swallowed]__ UI toast shows generic failure; console has detailed error but not surfaced to user; state not updated. Ensure errors are logged and surfaced.

## Diagnostics Checklist
- __[env]__ Create `.env` with Cloudinary creds (or set in Netlify UI):
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`
  - (Optional) `VITE_API_URL` when pointing to a custom API base.
- __[dev_mode]__ Decide runtime:
  - Netlify Functions (recommended): `npm run start:netlify` → functions under `/.netlify/functions/*`.
  - Local Express API: `npm run start` (ensures `src/server/server.ts` is up) → endpoint `http://localhost:3002/api/photo-upload`. Confirm that route exists; if not, use Netlify.
- __[network]__ In browser DevTools → Network tab while saving photo:
  - Confirm a POST to `/photo-upload` relative to base, full URL correct.
  - Status code 200; if 4xx/5xx, inspect response JSON.
- __[function_logs]__ Check Netlify function logs for errors when hitting `photo-upload`.
- __[UI_logs]__ Confirm console logs from `PhotoUploadService.uploadPhoto` and `App.jsx` `handlePhotoUpload` appear, proving the handler is firing.

## Corrective Plan
1) __Ensure function availability__
   - Run `npm run start:netlify` locally for functions routing.
   - Or set `VITE_API_URL='/.netlify/functions'` in `.env` so `apiClient` always targets functions even on non-8888 ports.
2) __Set Cloudinary credentials__
   - Provide `CLOUDINARY_*` envs locally and in Netlify dashboard (Site → Settings → Environment).
3) __Harden client error handling__
   - In `StopCardActions.tsx`, surface specific error messages (from `ApiError` body) to the toast so users know if it’s a misconfig (e.g., missing env) vs network error.
4) __Add a direct endpoint probe__
   - Add a tiny dev-only button or console test to POST a minimal FormData to `/photo-upload` and print the response.
5) __Verify base URL resolution__
   - If you want to avoid Express entirely, force functions:
     - In `.env.local` add `VITE_API_URL='/.netlify/functions'`.
     - `apiClient` will target `/.netlify/functions/photo-upload` in all environments.
6) __Regression-proof__
   - Add an integration test that mocks `fetch` for `apiClient.requestFormData` and asserts the UI transitions to done and saves to store on 200.

## Suggested Code Adjustments
- __apiClient base (optional)__
  - In `src/services/apiClient.ts`, allow an explicit override and log final base on startup.
- __UI error visibility__
  - In `StopCardActions.tsx`, when catch occurs, inspect `(err as ApiError).body?.error` and include in toast if available.
- __App.jsx upload handler__
  - Ensure it logs the full error and does not silently swallow.

## Acceptance Criteria
- Upload works locally using Netlify dev or configured API base.
- On success, state updates: progress[stopId].photo set; stop marked done; toast confirms.
- On failure, a clear toast shows HTTP status and message.

## Prompt to Execute Fix
"""
You are fixing the photo upload flow (button → preview → save → Cloudinary URL returned and state updated).

Tasks:
1) Run with Netlify Functions locally: `npm run start:netlify`. Alternatively, set `VITE_API_URL='/.netlify/functions'` to always target functions.
2) Add Cloudinary env values locally/.env and on Netlify: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
3) In the browser DevTools, confirm a POST request to `/.netlify/functions/photo-upload` with `multipart/form-data` occurs and returns 200. If it fails, copy response and logs.
4) Improve error surfacing in `StopCardActions.tsx`:
   - When catching an error, if it is an ApiError with a JSON body, include `body.error` in the toast.
5) If running in plain vite dev, ensure the Express API has `/api/photo-upload`; otherwise use Netlify dev.
6) Add an integration test that stubs the `apiClient.requestFormData` call to return `{ photoUrl, publicId, ... }` and verify the stop transitions to done and the photo is saved in store.

Validation:
- Upload a photo; see successful network and UI state update.
- Stop shows as completed and appears in completed tab.
- Toast confirms success. On error, toast shows status and message.
"""
