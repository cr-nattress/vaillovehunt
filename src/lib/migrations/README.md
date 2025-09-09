# Data Migrations

This directory contains schema migration utilities for the App/Org JSON data model.

## Usage

```typescript
import { 
  migrateAppJson, 
  migrateOrgJson, 
  getDefaultAppJson,
  createMinimalOrgJson 
} from './lib/migrations'

// Migrate app data from storage
const appData = migrateAppJson(rawDataFromBlob)

// Migrate org data from storage  
const orgData = migrateOrgJson(rawOrgDataFromBlob)

// Create new structures
const defaultApp = getDefaultAppJson()
const newOrg = createMinimalOrgJson('acme', 'ACME Corp', 'admin@acme.com')
```

## Schema Validation

You can test schemas in isolation:

```typescript
import { AppDataSchema, OrgDataSchema } from '../../types/appData.schemas'
import { validateOrgJson } from './lib/migrations'

// Direct schema validation
const result = AppDataSchema.safeParse(someData)
if (!result.success) {
  console.log('Validation errors:', result.error)
}

// Organization validation helper
const validation = validateOrgJson(orgData)
if (!validation.valid) {
  console.log('Org validation failed:', validation.errors)
}
```

## Migration Philosophy

- **Backward compatible**: Old data should always migrate to current schema
- **Fail-safe**: Migration failures return sensible defaults (App) or throw (Org)  
- **Versioned**: Each schema version has explicit migration steps
- **Type-safe**: All migrations preserve TypeScript type safety

## TODO: Future Phases

- [ ] Implement version detection logic
- [ ] Add per-version migration chains (v1.0→v1.1→v1.2)
- [ ] Add comprehensive migration tests
- [ ] Consider data backup before migrations
- [ ] Add migration performance monitoring