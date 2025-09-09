/**
 * Azure Table Storage Adapters - Phase 1 Implementation
 * 
 * Implements repository ports using Azure Table Storage with optimized schema design.
 * Uses strategic PartitionKey/RowKey design for efficient queries and global secondary indexes.
 */

import {
  EventRepoPort,
  EventSummary,
  Event,
  ETagged,
  ListTodayInput,
  GetEventInput,
  UpsertEventInput
} from '../../ports/event.repo.port'

import {
  OrgRepoPort,
  BlobResult,
  GetOrgInput,
  UpsertOrgInput,
  UpsertAppInput,
  ListOrgsInput,
  OrgSummary
} from '../../ports/org.repo.port'

import { AppData } from '../../types/appData.schemas'
import { OrgData, Hunt } from '../../types/orgData.schemas'
import { azureTableService, AzureTableEntity } from '../../services/AzureTableService'
import { validateAppData, validateOrgData } from '../../schemas/index'
import { getFlag } from '../../config/flags'

/**
 * Azure Table Schema Design:
 * 
 * AppRegistry Table:
 * - PK: "app", RK: "config" -> Global app configuration
 * 
 * Organizations Table: 
 * - PK: "{orgSlug}", RK: "org" -> Organization metadata
 * 
 * HuntIndex Table (Global Secondary Index):
 * - PK: "YYYY-MM-DD", RK: "{orgSlug}:{huntId}" -> Date-based hunt lookup
 * 
 * Hunts Table:
 * - PK: "{orgSlug}", RK: "{huntId}" -> Hunt definitions
 */

interface AppRegistryEntity extends AzureTableEntity {
  partitionKey: 'app'
  rowKey: 'config'
  appDataJson: string
  schemaVersion: string
}

interface OrganizationEntity extends AzureTableEntity {
  partitionKey: string // orgSlug
  rowKey: 'org'
  orgDataJson: string
  orgName: string
  schemaVersion: string
}

interface HuntIndexEntity extends AzureTableEntity {
  partitionKey: string // YYYY-MM-DD
  rowKey: string       // orgSlug:huntId
  orgSlug: string
  huntId: string
  huntName: string
  status: string
}

interface HuntEntity extends AzureTableEntity {
  partitionKey: string // orgSlug
  rowKey: string       // huntId
  huntJson: string
  huntName: string
  startDate: string
  endDate: string
  status: string
}

/**
 * Configuration for Azure Table adapters
 */
interface AzureTableAdapterConfig {
  autoMigrate: boolean
  strictValidation: boolean
  enableCaching: boolean
}

/**
 * Default configuration factory
 */
function getAzureTableAdapterConfig(): AzureTableAdapterConfig {
  return {
    autoMigrate: true,
    strictValidation: false,
    enableCaching: false // Disable for Phase 1, enable in Phase 6
  }
}

export class AzureTableEventRepoAdapter implements EventRepoPort {
  private config: AzureTableAdapterConfig
  
  constructor(config?: Partial<AzureTableAdapterConfig>) {
    this.config = { ...getAzureTableAdapterConfig(), ...config }
    console.log('🗂️ AzureTableEventRepoAdapter initialized:', this.config)
  }
  
  /**
   * List today's events using HuntIndex table for efficient date queries
   */
  async listToday(input: ListTodayInput): Promise<EventSummary[]> {
    try {
      console.log('📅 AzureTableEventRepoAdapter.listToday:', input)
      
      const dateKey = input.date || new Date().toISOString().split('T')[0]
      
      // Query HuntIndex table by date partition
      const huntIndexEntries = await azureTableService.queryEntities<HuntIndexEntity>(
        'HuntIndex',
        { filter: `PartitionKey eq '${dateKey}'` }
      )
      
      console.log(`📅 Found ${huntIndexEntries.length} hunt index entries for ${dateKey}`)
      
      // Convert to EventSummary format
      const eventSummaries: EventSummary[] = huntIndexEntries.map(entry => ({
        orgSlug: entry.orgSlug,
        huntId: entry.huntId,
        huntSlug: entry.huntId, // Simplified mapping
        huntName: entry.huntName,
        startDate: dateKey,
        endDate: dateKey, // Would need hunt lookup for accurate end date
        status: entry.status as any
      }))
      
      return eventSummaries
    } catch (error) {
      console.error('❌ AzureTableEventRepoAdapter.listToday failed:', error)
      throw error
    }
  }
  
  /**
   * Get specific event by reading hunt from Hunts table
   */
  async getEvent(input: GetEventInput): Promise<Event> {
    try {
      console.log('📖 AzureTableEventRepoAdapter.getEvent:', input)
      
      // Get hunt entity from Hunts table
      const huntResult = await azureTableService.getEntity<HuntEntity>(
        'Hunts',
        input.orgSlug,
        input.huntId
      )
      
      const huntEntity = huntResult.data
      const huntData: Hunt = JSON.parse(huntEntity.huntJson)
      
      // Convert Hunt to Event format
      const event: Event = {
        orgSlug: input.orgSlug,
        huntId: huntData.id,
        huntSlug: huntData.slug,
        huntName: huntData.name,
        startDate: huntData.startDate,
        endDate: huntData.endDate,
        status: huntData.status,
        stops: huntData.stops || [],
        teams: huntData.teams?.map(team => team.name) || [],
        rules: huntData.rules?.content?.body || '',
        location: huntData.location ? {
          city: huntData.location.city,
          state: huntData.location.state,
          coordinates: null // Not in current schema
        } : undefined
      }
      
      console.log('✅ AzureTableEventRepoAdapter.getEvent found:', event.huntName)
      return event
    } catch (error) {
      console.error('❌ AzureTableEventRepoAdapter.getEvent failed:', error)
      throw error
    }
  }
  
  /**
   * Upsert event by updating hunt in Hunts table and maintaining HuntIndex
   */
  async upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>> {
    try {
      console.log('💾 AzureTableEventRepoAdapter.upsertEvent:', input.event.huntId)
      
      const event = input.event
      
      // Convert Event to Hunt format
      const huntData: Hunt = {
        id: event.huntId,
        slug: event.huntSlug,
        name: event.huntName,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        access: { visibility: 'public', pinRequired: false },
        scoring: { basePerStop: 10, bonusCreative: 5 },
        moderation: { required: false, reviewers: [] },
        stops: event.stops || [],
        location: event.location ? {
          city: event.location.city,
          state: event.location.state,
          zip: '' // Default
        } : undefined
      }
      
      // Create hunt entity
      const huntEntity: Partial<HuntEntity> = {
        partitionKey: event.orgSlug,
        rowKey: event.huntId,
        huntJson: JSON.stringify(huntData),
        huntName: event.huntName,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status
      }
      
      // Upsert hunt in Hunts table
      const huntEtag = await azureTableService.upsertEntity('Hunts', huntEntity, {
        expectedEtag: input.expectedEtag,
        mode: 'merge'
      })
      
      // Update HuntIndex for date-based queries
      const startDateKey = event.startDate
      const indexEntity: Partial<HuntIndexEntity> = {
        partitionKey: startDateKey,
        rowKey: `${event.orgSlug}:${event.huntId}`,
        orgSlug: event.orgSlug,
        huntId: event.huntId,
        huntName: event.huntName,
        status: event.status
      }
      
      await azureTableService.upsertEntity('HuntIndex', indexEntity, { mode: 'replace' })
      
      console.log('✅ AzureTableEventRepoAdapter.upsertEvent completed')
      
      return {
        data: event,
        etag: huntEtag
      }
    } catch (error) {
      console.error('❌ AzureTableEventRepoAdapter.upsertEvent failed:', error)
      throw error
    }
  }
}

export class AzureTableOrgRepoAdapter implements OrgRepoPort {
  private config: AzureTableAdapterConfig
  
  constructor(config?: Partial<AzureTableAdapterConfig>) {
    this.config = { ...getAzureTableAdapterConfig(), ...config }
    console.log('🏢 AzureTableOrgRepoAdapter initialized:', this.config)
  }
  
  /**
   * Get global app configuration from AppRegistry table
   */
  async getApp(): Promise<BlobResult<AppData>> {
    try {
      console.log('📋 AzureTableOrgRepoAdapter.getApp')
      
      const result = await azureTableService.getEntity<AppRegistryEntity>(
        'AppRegistry',
        'app',
        'config'
      )
      
      const appEntity = result.data
      const rawAppData = JSON.parse(appEntity.appDataJson)
      
      // Validate and potentially migrate app data
      const validation = await validateAppData(rawAppData, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation,
        includeWarnings: true
      })
      
      if (!validation.success) {
        throw new Error(`App data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      if (validation.migrationApplied) {
        console.log('🔄 Auto-saving migrated app data back to Azure Table Storage')
        const updatedEntity: Partial<AppRegistryEntity> = {
          partitionKey: 'app',
          rowKey: 'config',
          appDataJson: JSON.stringify(validation.data),
          schemaVersion: validation.data!.schemaVersion
        }
        await azureTableService.upsertEntity('AppRegistry', updatedEntity, {
          expectedEtag: result.etag,
          mode: 'replace'
        })
      }
      
      if (validation.warnings?.length) {
        console.warn('⚠️ App data validation warnings:', validation.warnings)
      }
      
      console.log('✅ AzureTableOrgRepoAdapter.getApp completed')
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.error('❌ AzureTableOrgRepoAdapter.getApp failed:', error)
      throw error
    }
  }
  
  /**
   * Get organization data from Organizations table
   */
  async getOrg(input: GetOrgInput): Promise<BlobResult<OrgData>> {
    try {
      console.log('🏢 AzureTableOrgRepoAdapter.getOrg:', input.orgSlug)
      
      const result = await azureTableService.getEntity<OrganizationEntity>(
        'Organizations',
        input.orgSlug,
        'org'
      )
      
      const orgEntity = result.data
      const rawOrgData = JSON.parse(orgEntity.orgDataJson)
      
      // Validate and potentially migrate org data
      const validation = await validateOrgData(rawOrgData, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation,
        includeWarnings: true
      })
      
      if (!validation.success) {
        throw new Error(`Org data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      if (validation.migrationApplied) {
        console.log(`🔄 Auto-saving migrated org data back to Azure Table Storage: ${input.orgSlug}`)
        const updatedEntity: Partial<OrganizationEntity> = {
          partitionKey: input.orgSlug,
          rowKey: 'org',
          orgDataJson: JSON.stringify(validation.data),
          orgName: validation.data!.org.orgName,
          schemaVersion: validation.data!.schemaVersion
        }
        await azureTableService.upsertEntity('Organizations', updatedEntity, {
          expectedEtag: result.etag,
          mode: 'replace'
        })
      }
      
      if (validation.warnings?.length) {
        console.warn(`⚠️ Org data validation warnings for ${input.orgSlug}:`, validation.warnings)
      }
      
      console.log(`✅ AzureTableOrgRepoAdapter.getOrg completed: ${input.orgSlug}`)
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.error(`❌ AzureTableOrgRepoAdapter.getOrg failed for ${input.orgSlug}:`, error)
      throw error
    }
  }
  
  /**
   * List organizations by querying Organizations table
   */
  async listOrgs(input?: ListOrgsInput): Promise<OrgSummary[]> {
    try {
      console.log('📋 AzureTableOrgRepoAdapter.listOrgs:', input)
      
      // Build query filter
      let filter = "RowKey eq 'org'"
      
      if (input?.nameFilter) {
        const nameFilter = input.nameFilter.toLowerCase()
        // Note: Azure Table Storage doesn't support full-text search, so we use contains
        filter += ` and (contains(tolower(orgName), '${nameFilter}') or contains(tolower(PartitionKey), '${nameFilter}'))`
      }
      
      const orgEntities = await azureTableService.queryEntities<OrganizationEntity>(
        'Organizations',
        { 
          filter,
          maxResults: input?.limit
        }
      )
      
      // Apply offset (Azure Tables doesn't support SKIP, so we do client-side filtering)
      const offset = input?.offset || 0
      const filteredEntities = orgEntities.slice(offset)
      
      // Convert to OrgSummary format
      const orgSummaries: OrgSummary[] = filteredEntities.map(entity => {
        const orgData: OrgData = JSON.parse(entity.orgDataJson)
        return {
          orgSlug: entity.partitionKey,
          orgName: entity.orgName,
          createdAt: orgData.org.createdAt || new Date().toISOString(),
          updatedAt: entity.timestamp?.toISOString() || new Date().toISOString(),
          huntCount: orgData.hunts?.length || 0
        }
      })
      
      console.log(`✅ AzureTableOrgRepoAdapter.listOrgs found ${orgSummaries.length} organizations`)
      
      return orgSummaries
    } catch (error) {
      console.error('❌ AzureTableOrgRepoAdapter.listOrgs failed:', error)
      throw error
    }
  }
  
  /**
   * Create or update organization data with ETag-based optimistic concurrency
   */
  async upsertOrg(input: UpsertOrgInput): Promise<string | undefined> {
    try {
      console.log('💾 AzureTableOrgRepoAdapter.upsertOrg:', input.orgSlug)
      
      // Validate org data before saving
      const validation = await validateOrgData(input.orgData, {
        strict: this.config.strictValidation
      })
      
      if (!validation.success) {
        throw new Error(`Org data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      const validatedData = validation.data!
      
      // Add timestamp
      const timestampedData = {
        ...validatedData,
        updatedAt: new Date().toISOString()
      }
      
      // Create organization entity
      const orgEntity: Partial<OrganizationEntity> = {
        partitionKey: input.orgSlug,
        rowKey: 'org',
        orgDataJson: JSON.stringify(timestampedData),
        orgName: timestampedData.org.orgName,
        schemaVersion: timestampedData.schemaVersion
      }
      
      const etag = await azureTableService.upsertEntity('Organizations', orgEntity, {
        expectedEtag: input.expectedEtag,
        mode: 'replace'
      })
      
      console.log(`✅ AzureTableOrgRepoAdapter.upsertOrg completed: ${input.orgSlug}`)
      
      return etag
    } catch (error) {
      console.error(`❌ AzureTableOrgRepoAdapter.upsertOrg failed for ${input.orgSlug}:`, error)
      throw error
    }
  }
  
  /**
   * Update global app configuration with ETag-based optimistic concurrency
   */
  async upsertApp(input: UpsertAppInput): Promise<string | undefined> {
    try {
      console.log('💾 AzureTableOrgRepoAdapter.upsertApp')
      
      // Validate app data before saving
      const validation = await validateAppData(input.appData, {
        strict: this.config.strictValidation
      })
      
      if (!validation.success) {
        throw new Error(`App data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      const validatedData = validation.data!
      
      // Add timestamp
      const timestampedData = {
        ...validatedData,
        updatedAt: new Date().toISOString()
      }
      
      // Create app registry entity
      const appEntity: Partial<AppRegistryEntity> = {
        partitionKey: 'app',
        rowKey: 'config',
        appDataJson: JSON.stringify(timestampedData),
        schemaVersion: timestampedData.schemaVersion
      }
      
      const etag = await azureTableService.upsertEntity('AppRegistry', appEntity, {
        expectedEtag: input.expectedEtag,
        mode: 'replace'
      })
      
      console.log('✅ AzureTableOrgRepoAdapter.upsertApp completed')
      
      return etag
    } catch (error) {
      console.error('❌ AzureTableOrgRepoAdapter.upsertApp failed:', error)
      throw error
    }
  }
}