# New Data Model Implementation

This document describes the new blob-backed data model for the Vail Love Hunt application, implementing a dual JSON structure for scalable organization and hunt management.

## Architecture Overview

The new data model implements a **dual-write storage pattern** with feature flags for safe rollout:

```
App JSON (Global Registry)
├── Organization summaries
├── Date-based hunt index
└── Application configuration

Org JSON (Per-Organization)  
├── Hunt definitions
├── Organization details
└── Contact information
```

## Data Structures

### App JSON (`app.json`)

Global application registry containing:

- **Organization Registry**: List of all participating organizations
- **Date Index**: Fast lookup for "today's hunts" by date
- **Feature Flags**: Application-wide settings
- **Metadata**: App name, environment, defaults

```typescript
interface AppData {
  schemaVersion: string
  updatedAt: string
  app: {
    metadata: { name: string, environment: string }
    features: { enableBlobEvents: boolean, ... }
    defaults: { timezone: string, locale: string }
  }
  organizations: OrganizationSummary[]
  byDate?: { [date: string]: HuntIndexEntry[] }
}
```

### Organization JSON (`orgs/{orgSlug}.json`)

Per-organization data containing:

- **Hunt Definitions**: Complete hunt configurations
- **Organization Details**: Contacts, settings, branding
- **Team Management**: Default teams and assignments

```typescript
interface OrgData {
  schemaVersion: string
  updatedAt: string
  org: {
    orgSlug: string
    orgName: string
    contacts: Contact[]
    settings: OrgSettings
  }
  hunts: Hunt[]
}
```

## Services

### BlobService

Low-level abstraction for Netlify Blobs operations:

- **Read/Write JSON**: Type-safe blob operations
- **ETag Support**: Optimistic concurrency control
- **Error Handling**: Graceful degradation for network issues

### OrgRegistryService

High-level service for data management:

- **CRUD Operations**: Create, read, update operations
- **Date Indexing**: Automatic date-based hunt indexing
- **Data Validation**: Zod schema validation
- **Factory Methods**: Creating new organizations and hunts

### EventService (Enhanced)

Feature-flagged event fetching with blob backend:

- **Blob-Backed Events**: Query real data from App/Org JSON
- **Mock Fallback**: Graceful degradation when blob unavailable
- **Feature Flag Controlled**: `ENABLE_BLOB_EVENTS` controls behavior

## Components

### RulesPanel

Standalone component for hunt rules display:

- **Markdown Support**: Rich text formatting for rules
- **Acknowledgement Tracking**: Persistent user acknowledgement
- **LocalStorage Integration**: Client-side acknowledgement state
- **Collapsible UI**: Expandable rules content

### ModernSplashScreen (Enhanced)

Extended with new adventure creation:

- **Non-Blocking Persistence**: Immediate navigation with background save
- **Error Handling**: Toast notifications for persistence failures
- **Local-First**: Works offline, syncs when online

## Feature Flags

Safe rollout controlled by environment variables:

```typescript
// config.ts
export const config = {
  ENABLE_BLOB_EVENTS: import.meta.env.VITE_ENABLE_BLOB_EVENTS === 'true' || false,
  ENABLE_KV_EVENTS: import.meta.env.VITE_ENABLE_KV_EVENTS === 'true' || false,
}
```

### Development Setup

```bash
# Enable blob-backed events in development
echo "VITE_ENABLE_BLOB_EVENTS=true" >> .env

# Start application
npm start
```

## Implementation Phases

The implementation followed a **safest-first approach**:

1. **Phase 1**: Schemas and services (no UI changes)
2. **Phase 2**: New Adventure wizard scaffold (local-only)
3. **Phase 3**: Feature flag for blob-backed EventService (OFF by default)
4. **Phase 4**: Rules rendering component
5. **Phase 5**: Wire wizard Save to blob persistence (non-blocking)
6. **Phase 6**: Enable blob-backed EventService in dev
7. **Phase 7**: Tests and documentation

## Testing

Comprehensive test coverage includes:

- **Schema Validation**: Zod schema tests with edge cases
- **Service Layer**: Mock-based unit tests for CRUD operations
- **Component Testing**: React Testing Library tests for UI behavior
- **Integration Scenarios**: End-to-end data flow testing

Run tests:
```bash
npm test
```

## Error Handling

Graceful error handling at every layer:

- **Network Failures**: Service degradation with fallbacks
- **Schema Validation**: Clear error messages with validation details
- **Concurrent Modifications**: ETag-based conflict resolution
- **LocalStorage Limits**: Graceful handling of storage quota issues

## Performance Considerations

- **Date Indexing**: O(1) lookup for "today's hunts"
- **Lazy Loading**: Organizations loaded only when needed
- **ETag Caching**: Reduced bandwidth with conditional requests
- **Non-Blocking Saves**: UI responsiveness maintained during persistence

## Security

- **Input Validation**: All data validated with Zod schemas
- **URL-Safe Slugs**: Automatic slug generation for safe URLs
- **Email Validation**: Contact email format validation
- **No Secret Exposure**: Configuration safely handles sensitive data

## Future Enhancements

The new data model enables:

- **Multi-Organization Support**: Full organization isolation
- **Hunt Templates**: Reusable hunt configurations
- **Real-Time Updates**: WebSocket integration for live data
- **Advanced Permissions**: Role-based access control
- **Analytics**: Hunt participation and completion tracking

## Migration Path

Current implementation is **additive only**:

- Existing localStorage behavior preserved
- Mock events continue to work
- Feature flags control new functionality
- Zero breaking changes to existing UI

## Troubleshooting

### Common Issues

**"No events found"**: Check feature flag settings and blob store connectivity

**"Schema validation failed"**: Check data format against TypeScript types

**"ETag mismatch"**: Concurrent modification - retry with fresh data

### Debug Mode

Enable detailed logging:
```bash
# Browser console will show detailed operation logs
# Look for 🔍, ✅, ⚠️ prefixed messages
```

## API Reference

See TypeScript definitions in:
- `src/types/appData.schemas.ts` - App JSON schemas
- `src/types/orgData.schemas.ts` - Organization JSON schemas
- `src/services/BlobService.ts` - Blob operations
- `src/services/OrgRegistryService.ts` - High-level data management