# Bug: Social feed not showing uploaded images

## Summary
- Social feed page shows empty state despite photos being uploaded successfully to Cloudinary
- Impact: User-facing, moderate severity - teams cannot see each other's progress in the feed
- Environment: Local development environment (npm start), testing with BHHS/Vail/Blue team

## Reproduction
- Steps:
  1. Navigate to hunt page and upload a photo for any location
  2. Navigate to social feed page via footer navigation
  3. Observe that no posts are displayed despite successful photo upload
- Expected:
  - Social feed should display uploaded photos from all teams for the same location/event
- Actual:
  - Feed shows empty state with "Be the First to Share!" message

## Code Map
- UI entry point:
  - [`src/features/feed/components/FeedPage.tsx`] — loads feed via `FeedService.getAllFeedPosts()`
- State:
  - [`src/store/event.store.ts`] — provides `locationName`, `eventName`, `teamName` for filtering
- Data flow:
  - [FeedPage → FeedService → PhotoService → apiClient → backend photoRoute.ts → in-memory storage]
- Services / network:
  - Client: [`src/services/PhotoService.ts`] - getPhotosByCompanyEvent()
  - Backend: [`src/server/photoRoute.ts`] - in-memory Map storage
  - Photo upload: [`src/App.jsx`] handlePhotoUpload() → PhotoService.saveTeamPhoto()

## Diagnostics Checklist (run top-to-bottom)
- UI/DOM
  - ✅ Feed page renders correctly with empty state message
  - ✅ No console errors visible in UI components
- State
  - ✅ Event store correctly provides locationName='BHHS', eventName='Vail' 
  - ✅ FeedService correctly calls PhotoService.getPhotosByCompanyEvent() with proper filters
- Effects
  - ✅ Feed loads on navigation, no interfering side effects observed
- Network
  - ✅ Photo upload succeeds to Cloudinary (logs show successful upload)
  - ✅ Photo upload calls PhotoService.saveTeamPhoto() - but this may be failing silently
  - ✅ Feed API call shows: "PHOTO API: Found 0 photos for BHHS/Vail" - backend storage is empty
  - ⚠️ Backend photoRoute.ts uses in-memory Map storage that appears to be empty
- Tests
  - ❓ No tests written for feed functionality yet

## Hypotheses (mark true/false with evidence)
- [stale_prop_progress]: False - Feed uses direct API calls, not stale props
- [visibility_toggle_logic]: False - Empty state displays correctly, UI logic is working
- [css_animation]: False - No animations involved in feed display
- [reset_side_effect]: False - No state resets affecting feed functionality
- [env_network]: **TRUE** - Photo uploads save to Cloudinary but not to backend storage
- [data_shape]: False - API returns proper empty array structure, no data shape issues

## Evidence
- DOM:
  - Feed page renders empty state correctly with "Be the First to Share!" message
  - No console errors in browser
- Store:
  - Event store provides correct locationName='BHHS', eventName='Vail'
  - FeedService receives and uses proper filters
- Logs:
  - ✅ Photo upload successful: "Cloudinary upload successful: scavenger/entries/..."
  - ✅ App.jsx calls: "Saving photo record to PhotoService API..."
  - ❌ Backend shows: "PHOTO API: Found 0 photos for BHHS/Vail" - empty storage
- Network:
  - PhotoUploadService uploads to Cloudinary at /photo-upload endpoint ✅
  - App.jsx calls PhotoService.saveTeamPhoto() which hits /api/photos/company/.../team/... ✅
  - FeedService calls PhotoService.getPhotosByCompanyEvent() which hits /api/photos/company/.../event/... ✅
  - Backend photoRoute.ts uses in-memory Map storage that is empty ❌

## Root Cause
The photo upload successfully saves to Cloudinary but fails to save to the backend in-memory storage, causing the social feed to find no photos when querying for company/event photos.

## Fix Plan (minimal viable change)
1. Verify PhotoService.saveTeamPhoto() API call is actually reaching the backend
2. Add error handling/logging to identify if the API call is failing silently
3. Debug why backend photoRoute.ts in-memory storage is not receiving the photo data
4. Ensure proper error surfacing if API saves are failing

## Acceptance Criteria
- Photo upload saves to both Cloudinary AND backend storage
- Social feed displays uploaded photos from the current company/event
- Error messages surface properly if backend saves fail
- No regressions to existing upload functionality

## Post-Fix Validation
- Manual QA: Upload photo, navigate to social feed, verify photo appears
- Test that photos persist across page refreshes (in-memory storage limitation noted)
- Verify photos are properly filtered by company/event

## Complexity Estimate
- Low to Medium
- Likely a simple API call failure or error handling issue
- No cross-module impact beyond photo storage flow

## Runbook (quick commands/URLs)
- Local development: `npm start` (already running on ports 5183 + 3001)
- API base: http://localhost:3001/api (from apiClient.ts)
- Photo endpoints: 
  - POST `/api/photos/company/{company}/event/{event}/team/{team}` - save photo
  - GET `/api/photos/company/{company}/event/{event}` - get all photos for feed
- Key debug URLs:
  - Feed page: http://localhost:5183/#social
  - Hunt page: http://localhost:5183/ (for uploading test photos)