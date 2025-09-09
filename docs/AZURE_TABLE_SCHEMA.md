# Azure Table Storage Schema Design

This document defines the Azure Table Storage schema design for the Vail Love Hunt application, optimizing for query patterns and data consistency.

## Overview

The Azure Table Storage implementation uses a **multi-table design** optimized for specific access patterns:

1. **AppRegistry** - Global application configuration
2. **Organizations** - Organization metadata and settings  
3. **Hunts** - Hunt definitions with rich data
4. **HuntIndex** - Global secondary index for date-based queries

## Table Schemas

### 1. AppRegistry Table

Stores global application configuration and feature flags.

| Field | Type | Description |
|-------|------|-------------|
| **PartitionKey** | string | Fixed value: `"app"` |
| **RowKey** | string | Fixed value: `"config"` |
| **appDataJson** | string | JSON serialized AppData |
| **schemaVersion** | string | Data schema version |
| **timestamp** | DateTime | Azure managed timestamp |
| **etag** | string | Azure managed ETag |

**Access Patterns:**
- Read app config: `PK="app", RK="config"`
- Update app config: Upsert with ETag concurrency

### 2. Organizations Table

Stores organization metadata and complete organization data.

| Field | Type | Description |
|-------|------|-------------|
| **PartitionKey** | string | Organization slug (e.g., `"bhhs"`) |
| **RowKey** | string | Fixed value: `"org"` |
| **orgDataJson** | string | JSON serialized OrgData |
| **orgName** | string | Organization display name (for filtering) |
| **schemaVersion** | string | Data schema version |
| **timestamp** | DateTime | Azure managed timestamp |
| **etag** | string | Azure managed ETag |

**Access Patterns:**
- Get organization: `PK="{orgSlug}", RK="org"`
- List organizations: Query where `RK="org"`
- Search by name: Query with name filters

### 3. Hunts Table

Stores individual hunt definitions with full hunt data.

| Field | Type | Description |
|-------|------|-------------|
| **PartitionKey** | string | Organization slug (e.g., `"bhhs"`) |
| **RowKey** | string | Hunt ID (e.g., `"summer-2024"`) |
| **huntJson** | string | JSON serialized Hunt object |
| **huntName** | string | Hunt display name (for filtering) |
| **startDate** | string | ISO date string (for filtering) |
| **endDate** | string | ISO date string (for filtering) |
| **status** | string | Hunt status (for filtering) |
| **timestamp** | DateTime | Azure managed timestamp |
| **etag** | string | Azure managed ETag |

**Access Patterns:**
- Get specific hunt: `PK="{orgSlug}", RK="{huntId}"`
- List hunts for org: Query where `PK="{orgSlug}"`
- Filter hunts by status: Query with status filter

### 4. HuntIndex Table (Global Secondary Index)

Optimizes date-based hunt queries for "today's hunts" feature.

| Field | Type | Description |
|-------|------|-------------|
| **PartitionKey** | string | ISO date (e.g., `"2024-07-15"`) |
| **RowKey** | string | Composite key: `"{orgSlug}:{huntId}"` |
| **orgSlug** | string | Organization slug |
| **huntId** | string | Hunt ID |
| **huntName** | string | Hunt display name |
| **status** | string | Hunt status |
| **timestamp** | DateTime | Azure managed timestamp |
| **etag** | string | Azure managed ETag |

**Access Patterns:**
- Today's hunts: Query where `PK="YYYY-MM-DD"`
- Hunt status for date: Query with status filter
- Org hunts for date: Query with orgSlug filter

## Key Design Principles

### 1. Partition Key Strategy

- **AppRegistry**: Single partition (`"app"`) - low volume, high consistency
- **Organizations**: One partition per organization - natural data boundaries
- **Hunts**: Partition by organization - co-locates related data
- **HuntIndex**: Partition by date - optimizes "today's hunts" queries

### 2. Row Key Strategy

- **AppRegistry**: Fixed `"config"` - single configuration record
- **Organizations**: Fixed `"org"` - single org record per partition
- **Hunts**: Hunt ID - natural unique identifier within org
- **HuntIndex**: Composite `"orgSlug:huntId"` - ensures uniqueness

### 3. Query Optimization

**Hot Path: Today's Hunts**
```typescript
// Single partition query - highly efficient
const todayKey = "2024-07-15"
const hunts = await queryEntities('HuntIndex', { 
  filter: `PartitionKey eq '${todayKey}'` 
})
```

**Common Path: Organization Hunts**
```typescript
// Single partition query - efficient
const orgHunts = await queryEntities('Hunts', { 
  filter: `PartitionKey eq '${orgSlug}'` 
})
```

**Rare Path: Cross-Organization Queries**
```typescript
// Cross-partition query - acceptable for admin features
const allActiveHunts = await queryEntities('Hunts', { 
  filter: `status eq 'active'` 
})
```

### 4. Data Consistency

- **Optimistic Concurrency**: All upserts use ETag-based concurrency control
- **Atomic Updates**: Single entity updates are atomic within table
- **Eventually Consistent**: HuntIndex updates are eventually consistent with Hunts
- **Dual Write**: During migration, writes go to both Blob and Azure Tables

### 5. Schema Evolution

- **Schema Versioning**: All entities include schemaVersion field
- **Backward Compatibility**: Validation supports multiple schema versions
- **Auto-Migration**: Invalid data is migrated on read with write-back
- **Graceful Degradation**: Validation failures don't crash the application

## Migration Strategy

### Phase 1: Schema + Services (✅ Complete)
- Define Azure Table schema
- Implement AzureTableService with connection management
- Create adapters implementing existing repository ports

### Phase 2: Services + Adapters
- Wire adapters into repository factory
- Feature flag for adapter selection
- Health checks and monitoring

### Phase 3: Migration Tools
- Data migration scripts (Blob → Azure Tables)
- Schema validation and repair tools
- Backup and recovery procedures

### Phase 4: Dual-Write Implementation  
- Write to both Blob and Azure Tables
- Read from Azure Tables with Blob fallback
- Data consistency monitoring

### Phase 5: Validation + Testing
- Load testing with Azure Table queries
- Data consistency validation
- Performance benchmarking

### Phase 6: Azure-First Cutover
- Read from Azure Tables first
- Write to Azure Tables only
- Blob storage as backup only

### Phase 7: Decommission Blob Storage
- Remove Blob storage code paths
- Archive existing Blob data
- Complete migration documentation

## Performance Characteristics

### Expected Query Performance

| Operation | Partition Type | Expected Latency | RU Cost |
|-----------|----------------|------------------|---------|
| Get specific hunt | Single | <10ms | 1 RU |
| Today's hunts | Single | <20ms | 2-5 RU |
| Org hunts list | Single | <50ms | 5-10 RU |
| All orgs list | Cross-partition | <200ms | 10-20 RU |
| Search hunts | Cross-partition | <500ms | 20-50 RU |

### Scaling Limits

- **Single Partition**: 2,000 operations/second
- **Table Throughput**: 20,000 operations/second  
- **Entity Size**: 1MB maximum (JSON compression helps)
- **Properties**: 255 per entity (sufficient for current schema)

## Error Handling

### Common Error Scenarios

1. **EntityNotFound**: Hunt/org doesn't exist
   - **Handling**: Return appropriate 404 errors
   - **Recovery**: Check data migration status

2. **PreconditionFailed**: ETag mismatch (concurrent update)
   - **Handling**: Read fresh data and retry
   - **Recovery**: Implement exponential backoff

3. **TableStorageException**: Network/service errors
   - **Handling**: Fallback to Blob storage during migration
   - **Recovery**: Circuit breaker pattern

4. **SchemaValidationError**: Data doesn't match expected schema
   - **Handling**: Auto-migrate on read if possible
   - **Recovery**: Log for manual intervention

### Monitoring and Alerting

- **Query Latency**: P95 latency thresholds per operation type
- **Error Rate**: Overall error rate <0.1%
- **Schema Migrations**: Count of auto-migrations performed
- **Dual Write Consistency**: Percentage of consistent reads

## Security Considerations

### Access Control
- **Connection String**: Stored in environment variables only
- **Managed Identity**: Preferred for production (Azure-to-Azure)
- **Table Permissions**: Read/Write/Delete permissions required
- **Audit Logging**: All mutations logged for compliance

### Data Privacy
- **PII Handling**: Contact emails in org data (encrypted at rest)
- **Geographic Compliance**: Table region matches compliance requirements  
- **Data Retention**: Automatic cleanup of old hunt data
- **Backup Encryption**: All backups encrypted

## Local Development

### Azurite Setup
```bash
# Install Azurite emulator
npm install -g azurite

# Start Azure Table Storage emulator
azurite --silent --location ./data/azurite --debug ./logs/azurite.log

# Configure application
export ENABLE_AZURITE_LOCAL=true
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"
```

### Feature Flag Configuration
```bash
# Enable Azure Tables for testing
export VITE_ENABLE_AZURE_TABLES=true

# Enable dual-write during migration
export VITE_DUAL_WRITE_TO_AZURE=true

# Read from Azure first (post-migration)
export VITE_READ_FROM_AZURE_FIRST=true
```

## Troubleshooting

### Common Issues

**"Table does not exist"**
- Tables are auto-created on first access
- Check connection string and permissions

**"ETag mismatch"** 
- Concurrent modification detected
- Implement retry logic with fresh read

**"Request rate too high"**
- Partition hot-spotting or burst traffic
- Implement backoff and retry logic

**"Entity too large"**
- JSON payload exceeds 1MB limit
- Consider data compression or normalization

### Debug Logging

Enable detailed Azure Table operations logging:
```typescript
// Set environment variable
process.env.AZURE_LOG_LEVEL = 'verbose'

// Check console for detailed operation logs
// Look for 🗂️, 📅, 💾, ✅, ❌ prefixed messages
```