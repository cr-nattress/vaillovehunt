# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start UI (port 5173) + Cloudinary API server (port 3001)
- `npm run start:full` - Start all services: UI + Cloudinary API + State Server (port 3002)
- `npm run start:netlify` - Run production-like environment with Netlify Functions locally
- `npm run dev` - React app only via Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Testing & Quality
- `npm test` - Run test suite with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Architecture

### Core Services Pattern
The application uses a **dual-write storage pattern** for data persistence:
1. **DualWriteService** (`src/client/DualWriteService.js`) orchestrates both localStorage (immediate) and Netlify Blobs (async) writes
2. **PhotoUploadService** (`src/client/PhotoUploadService.ts`) handles photo uploads with multi-tier fallback strategy
3. **CollageService** (`src/client/CollageService.ts`) generates photo collages via Cloudinary transformations

### New Data Model Services (v2)
Feature-flagged blob-backed data architecture:
1. **BlobService** (`src/services/BlobService.ts`) - Low-level Netlify Blobs abstraction with ETag support
2. **OrgRegistryService** (`src/services/OrgRegistryService.ts`) - High-level CRUD operations for App/Org JSON
3. **EventService** (`src/services/EventService.ts`) - Enhanced with blob-backed event fetching (feature flagged)

### State Management Flow
```
User Action → DualWriteService → localStorage (sync)
                              ↘ NetlifyStateService → Netlify Blobs (async)
```

### Component Organization
- **Feature modules** in `src/features/` contain related components, hooks, and utilities
- **Shared components** in `src/components/` for reusable UI elements
- **Services** in `src/client/` handle external integrations
- **Server code** in `src/server/` for local development Express server
- **Serverless functions** in `netlify/functions/` for production

### Key Architectural Decisions
1. **Dual-write pattern** ensures data persistence even when network fails
2. **Progressive enhancement** - app works offline with localStorage, syncs when online
3. **Multi-tier photo upload** - tries direct browser upload first, falls back to server proxy
4. **Cloudinary for image processing** - handles compression, transformations, and CDN delivery

### Deployment Context
- **Platform**: Netlify with serverless functions
- **Storage**: Netlify Blobs for server-side persistence
- **Images**: Cloudinary for processing and CDN
- **API Routes**: `/api/*` proxies to `/.netlify/functions/*` in production

### Environment Variables
Required for full functionality:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (default: "scavenger/entries")
- `NETLIFY_BLOBS_STORE_NAME` (default: "vail-hunt-state")

### Feature Flags (v2 Data Model)
Control new blob-backed features:
- `VITE_ENABLE_BLOB_EVENTS` - Enable blob-backed event fetching (default: false)
- `VITE_ENABLE_KV_EVENTS` - Enable KV-backed events (default: false)

### New Data Architecture
The v2 data model implements a **dual JSON structure**:
- **App JSON** (`app.json`) - Global registry with organization summaries and date index
- **Org JSON** (`orgs/{orgSlug}.json`) - Per-organization hunt data and settings

See `docs/NEW_DATA_MODEL.md` for detailed architecture documentation.