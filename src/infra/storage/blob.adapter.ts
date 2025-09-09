/**
 * Blob Storage Adapter - Phase 4 Implementation
 * 
 * Complete implementation of repository ports using Netlify Blob storage.
 * Integrates with schema validation and migration system for data integrity.
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
import { blobService } from '../../services/BlobService'
import { validateAppData, validateOrgData } from '../../schemas/index'
import { getConfig } from '../../config/config'

/**
 * Configuration for blob adapters
 */
interface BlobAdapterConfig {
  storeName: string
  autoMigrate: boolean
  strictValidation: boolean
}

/**
 * Default configuration factory
 */
function getBlobAdapterConfig(): BlobAdapterConfig {
  const storeName = getConfig('netlify', 'blobsStoreName')
  return {
    storeName: storeName,
    autoMigrate: true,
    strictValidation: false
  }
}

export class BlobEventRepoAdapter implements EventRepoPort {
  private config: BlobAdapterConfig
  
  constructor(config?: Partial<BlobAdapterConfig>) {
    this.config = { ...getBlobAdapterConfig(), ...config }
    console.log('🗂️ BlobEventRepoAdapter initialized:', this.config)
  }
  
  /**
   * List today's events by reading app.json date index
   */
  async listToday(input: ListTodayInput): Promise<EventSummary[]> {
    try {
      console.log('📅 BlobEventRepoAdapter.listToday:', input)
      
      // Read app.json to get date index
      const appResult = await blobService.readJson<any>('app.json')
      
      // Validate and potentially migrate app data
      const validation = await validateAppData(appResult.data, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation
      })
      
      if (!validation.success) {
        throw new Error(`App data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      const appData = validation.data!
      
      if (!appData.byDate) {
        console.log('📅 No date index found, returning empty list')
        return []
      }
      
      // Find today's events
      const todayKey = input.date || new Date().toISOString().split('T')[0]
      const todayEntries = appData.byDate[todayKey] || []
      
      console.log(`📅 Found ${todayEntries.length} events for ${todayKey}`)
      
      // Convert to EventSummary format
      const eventSummaries: EventSummary[] = todayEntries.map(entry => ({
        orgSlug: entry.orgSlug,
        huntId: entry.huntId,
        huntSlug: entry.huntId, // Simplified mapping
        huntName: entry.huntId, // Would need org lookup for real name
        startDate: todayKey,
        endDate: todayKey,
        status: 'active' // Default status, would need org lookup for real status
      }))
      
      return eventSummaries
    } catch (error) {
      console.error('❌ BlobEventRepoAdapter.listToday failed:', error)
      throw error
    }
  }
  
  /**
   * Get specific event by reading org data and finding hunt
   */
  async getEvent(input: GetEventInput): Promise<Event> {
    try {
      console.log('📖 BlobEventRepoAdapter.getEvent:', input)
      
      const orgKey = `orgs/${input.orgSlug}.json`
      const orgResult = await blobService.readJson<any>(orgKey)
      
      // Validate and potentially migrate org data
      const validation = await validateOrgData(orgResult.data, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation
      })
      
      if (!validation.success) {
        throw new Error(`Org data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      const orgData = validation.data!
      
      // Find the hunt
      const hunt = orgData.hunts.find(h => h.id === input.huntId)
      
      if (!hunt) {
        throw new Error(`Hunt ${input.huntId} not found in org ${input.orgSlug}`)
      }
      
      // Convert Hunt to Event format
      const event: Event = {
        orgSlug: input.orgSlug,
        huntId: hunt.id,
        huntSlug: hunt.slug,
        huntName: hunt.name,
        startDate: hunt.startDate,
        endDate: hunt.endDate,
        status: hunt.status,
        stops: hunt.stops || [],
        teams: hunt.teams?.map(team => team.name) || [],
        rules: hunt.rules?.content?.body || '',
        location: hunt.location ? {
          city: hunt.location.city,
          state: hunt.location.state,
          coordinates: null // Not in current schema
        } : undefined
      }
      
      console.log('✅ BlobEventRepoAdapter.getEvent found:', event.huntName)
      return event
    } catch (error) {
      console.error('❌ BlobEventRepoAdapter.getEvent failed:', error)
      throw error
    }
  }
  
  /**
   * Upsert event by updating hunt in org data
   */
  async upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>> {
    try {
      console.log('💾 BlobEventRepoAdapter.upsertEvent:', input.event.huntId)
      
      const orgKey = `orgs/${input.event.orgSlug}.json`
      const orgResult = await blobService.readJson<any>(orgKey)
      
      // Validate and potentially migrate org data
      const validation = await validateOrgData(orgResult.data, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation
      })
      
      if (!validation.success) {
        throw new Error(`Org data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      const orgData = validation.data!
      
      // Convert Event to Hunt format and update
      const huntIndex = orgData.hunts.findIndex(h => h.id === input.event.huntId)
      
      const updatedHunt: Hunt = {
        id: input.event.huntId,
        slug: input.event.huntSlug,
        name: input.event.huntName,
        startDate: input.event.startDate,
        endDate: input.event.endDate,
        status: input.event.status,
        access: { visibility: 'public', pinRequired: false },
        scoring: { basePerStop: 10, bonusCreative: 5 },
        moderation: { required: false, reviewers: [] },
        stops: input.event.stops || [],
        location: input.event.location ? {
          city: input.event.location.city,
          state: input.event.location.state,
          zip: '' // Default
        } : undefined
      }
      
      if (huntIndex >= 0) {
        orgData.hunts[huntIndex] = { ...orgData.hunts[huntIndex], ...updatedHunt }
      } else {
        orgData.hunts.push(updatedHunt)
      }
      
      // Write back to blob storage
      const writeResult = await blobService.writeJson(orgKey, orgData, input.expectedEtag)
      
      console.log('✅ BlobEventRepoAdapter.upsertEvent completed')
      
      return {
        data: input.event,
        etag: writeResult.etag
      }
    } catch (error) {
      console.error('❌ BlobEventRepoAdapter.upsertEvent failed:', error)
      throw error
    }
  }
}

export class BlobOrgRepoAdapter implements OrgRepoPort {
  private config: BlobAdapterConfig
  
  constructor(config?: Partial<BlobAdapterConfig>) {
    this.config = { ...getBlobAdapterConfig(), ...config }
    console.log('🏢 BlobOrgRepoAdapter initialized:', this.config)
  }
  
  /**
   * Get global app configuration from app.json
   */
  async getApp(): Promise<BlobResult<AppData>> {
    try {
      console.log('📋 BlobOrgRepoAdapter.getApp')
      
      const result = await blobService.readJson<any>('app.json')
      
      // Validate and potentially migrate app data
      const validation = await validateAppData(result.data, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation,
        includeWarnings: true
      })
      
      if (!validation.success) {
        throw new Error(`App data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      if (validation.migrationApplied) {
        console.log('🔄 Auto-saving migrated app data back to blob storage')
        await blobService.writeJson('app.json', validation.data, result.etag)
      }
      
      if (validation.warnings?.length) {
        console.warn('⚠️ App data validation warnings:', validation.warnings)
      }
      
      console.log('✅ BlobOrgRepoAdapter.getApp completed')
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.error('❌ BlobOrgRepoAdapter.getApp failed:', error)
      throw error
    }
  }
  
  /**
   * Get organization data from orgs/{orgSlug}.json
   */
  async getOrg(input: GetOrgInput): Promise<BlobResult<OrgData>> {
    try {
      console.log('🏢 BlobOrgRepoAdapter.getOrg:', input.orgSlug)
      
      const orgKey = `orgs/${input.orgSlug}.json`
      const result = await blobService.readJson<any>(orgKey)
      
      // Validate and potentially migrate org data
      const validation = await validateOrgData(result.data, {
        autoMigrate: this.config.autoMigrate,
        strict: this.config.strictValidation,
        includeWarnings: true
      })
      
      if (!validation.success) {
        throw new Error(`Org data validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }
      
      if (validation.migrationApplied) {
        console.log(`🔄 Auto-saving migrated org data back to blob storage: ${input.orgSlug}`)
        await blobService.writeJson(orgKey, validation.data, result.etag)
      }
      
      if (validation.warnings?.length) {
        console.warn(`⚠️ Org data validation warnings for ${input.orgSlug}:`, validation.warnings)
      }
      
      console.log(`✅ BlobOrgRepoAdapter.getOrg completed: ${input.orgSlug}`)
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.error(`❌ BlobOrgRepoAdapter.getOrg failed for ${input.orgSlug}:`, error)
      throw error
    }
  }
  
  /**
   * List organizations from app.json registry with optional filtering
   */
  async listOrgs(input?: ListOrgsInput): Promise<OrgSummary[]> {
    try {
      console.log('📋 BlobOrgRepoAdapter.listOrgs:', input)
      
      const appResult = await this.getApp()
      const appData = appResult.data
      
      let orgs = appData.organizations.slice()
      
      // Apply name filter if provided
      if (input?.nameFilter) {
        const filter = input.nameFilter.toLowerCase()
        orgs = orgs.filter(org => 
          org.orgName.toLowerCase().includes(filter) ||
          org.orgSlug.toLowerCase().includes(filter)
        )
      }
      
      // Apply pagination
      const offset = input?.offset || 0
      const limit = input?.limit || orgs.length
      orgs = orgs.slice(offset, offset + limit)
      
      // Convert to OrgSummary format
      const orgSummaries: OrgSummary[] = orgs.map(org => ({
        orgSlug: org.orgSlug,
        orgName: org.orgName,
        createdAt: org.createdAt,
        updatedAt: org.createdAt, // Using same value as approximation
        huntCount: org.summary?.huntsTotal || 0
      }))
      
      console.log(`✅ BlobOrgRepoAdapter.listOrgs found ${orgSummaries.length} organizations`)
      
      return orgSummaries
    } catch (error) {
      console.error('❌ BlobOrgRepoAdapter.listOrgs failed:', error)
      throw error
    }
  }
  
  /**
   * Create or update organization data with ETag-based optimistic concurrency
   */
  async upsertOrg(input: UpsertOrgInput): Promise<string | undefined> {
    try {
      console.log('💾 BlobOrgRepoAdapter.upsertOrg:', input.orgSlug)
      
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
      
      const orgKey = `orgs/${input.orgSlug}.json`
      const writeResult = await blobService.writeJson(orgKey, timestampedData, input.expectedEtag)
      
      console.log(`✅ BlobOrgRepoAdapter.upsertOrg completed: ${input.orgSlug}`)
      
      return writeResult.etag
    } catch (error) {
      console.error(`❌ BlobOrgRepoAdapter.upsertOrg failed for ${input.orgSlug}:`, error)
      throw error
    }
  }
  
  /**
   * Update global app configuration with ETag-based optimistic concurrency
   */
  async upsertApp(input: UpsertAppInput): Promise<string | undefined> {
    try {
      console.log('💾 BlobOrgRepoAdapter.upsertApp')
      
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
      
      const writeResult = await blobService.writeJson('app.json', timestampedData, input.expectedEtag)
      
      console.log('✅ BlobOrgRepoAdapter.upsertApp completed')
      
      return writeResult.etag
    } catch (error) {
      console.error('❌ BlobOrgRepoAdapter.upsertApp failed:', error)
      throw error
    }
  }
}