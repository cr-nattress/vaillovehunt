/**
 * OrgRegistryService V2 - Phase 5 Refactoring
 * 
 * Clean architecture implementation using the adapter system from Phase 4.
 * Replaces direct blob service calls with ports and adapters pattern.
 */

import { getOrgRepo } from '../infra/registry'
import { getFlags } from '../config'
import type { OrgRepoPort } from '../ports/org.repo.port'
import type { AppData, OrganizationSummary, HuntIndexEntry } from '../types/appData.schemas'
import type { OrgData, Hunt } from '../types/orgData.schemas'
import { slugify } from '../utils/slug'

/**
 * Service configuration
 */
interface OrgRegistryConfig {
  enableCaching: boolean
  cacheExpiryMs: number
  autoMigration: boolean
  strictValidation: boolean
}

/**
 * Organization creation parameters
 */
export interface CreateOrgRequest {
  orgSlug: string
  orgName: string
  contacts: Array<{
    firstName: string
    lastName: string
    email: string
  }>
  settings?: {
    defaultTeams?: string[]
    timezone?: string
    locale?: string
  }
}

/**
 * Hunt creation parameters
 */
export interface CreateHuntRequest {
  huntName: string
  startDate: string
  endDate: string
  createdBy: string
  location?: {
    city: string
    state: string
    zip: string
  }
  options?: {
    visibility?: 'public' | 'private'
    pinRequired?: boolean
    basePerStop?: number
    bonusCreative?: number
    moderationRequired?: boolean
  }
}

/**
 * OrgRegistryService V2 using clean architecture
 */
export class OrgRegistryServiceV2 {
  private orgRepo: OrgRepoPort
  private config: OrgRegistryConfig
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  constructor(config?: Partial<OrgRegistryConfig>) {
    // Dependency injection via adapter registry
    this.orgRepo = getOrgRepo()
    
    this.config = {
      enableCaching: true,
      cacheExpiryMs: 10 * 60 * 1000, // 10 minutes
      autoMigration: true,
      strictValidation: true,
      ...config
    }

    console.log('🏢 OrgRegistryServiceV2 initialized:', {
      orgRepo: this.orgRepo.constructor.name,
      config: this.config
    })
  }

  /**
   * Load App JSON data with enhanced caching and migration
   */
  async loadApp(): Promise<{ data: AppData; etag?: string }> {
    const cacheKey = 'app'

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cached = this.cache.get(cacheKey)
        if (cached && Date.now() < cached.expiry) {
          console.log('💾 OrgRegistryServiceV2: Using cached app data')
          return cached.data
        }
      }

      console.log('📱 OrgRegistryServiceV2: Loading app data')
      const result = await this.orgRepo.getApp()

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: result,
          expiry: Date.now() + this.config.cacheExpiryMs
        })
      }

      console.log('✅ OrgRegistryServiceV2: App data loaded successfully:', {
        schemaVersion: result.data.schemaVersion,
        organizationCount: result.data.organizations.length,
        byDateEntries: result.data.byDate ? Object.keys(result.data.byDate).length : 0
      })

      return result

    } catch (error) {
      console.error('❌ OrgRegistryServiceV2: Failed to load app data:', error)
      throw error
    }
  }

  /**
   * Load organization data with enhanced error handling
   */
  async loadOrg(orgSlug: string): Promise<{ data: OrgData; etag?: string }> {
    const cacheKey = `org:${orgSlug}`

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cached = this.cache.get(cacheKey)
        if (cached && Date.now() < cached.expiry) {
          console.log(`💾 OrgRegistryServiceV2: Using cached org data for ${orgSlug}`)
          return cached.data
        }
      }

      console.log(`🏢 OrgRegistryServiceV2: Loading org data for ${orgSlug}`)
      const result = await this.orgRepo.getOrg({ orgSlug })

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: result,
          expiry: Date.now() + this.config.cacheExpiryMs
        })
      }

      console.log(`✅ OrgRegistryServiceV2: Org data loaded for ${orgSlug}:`, {
        orgName: result.data.org.orgName,
        contactCount: result.data.org.contacts.length,
        huntCount: result.data.hunts.length
      })

      return result

    } catch (error) {
      console.error(`❌ OrgRegistryServiceV2: Failed to load org ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Create a new organization with comprehensive setup
   */
  async createOrganization(request: CreateOrgRequest): Promise<{ data: OrgData; etag?: string }> {
    try {
      console.log('🏗️ OrgRegistryServiceV2: Creating new organization:', {
        orgSlug: request.orgSlug,
        orgName: request.orgName,
        contactCount: request.contacts.length
      })

      const newOrgData = this.buildNewOrgData(request)
      
      // Create via adapter
      const etag = await this.orgRepo.upsertOrg({
        orgSlug: request.orgSlug,
        orgData: newOrgData
      })

      const result = { data: newOrgData, etag }

      // Update App JSON registry
      await this.addOrganizationToApp(request.orgSlug, {
        orgSlug: request.orgSlug,
        orgName: request.orgName,
        contactEmail: request.contacts[0]?.email || '',
        status: 'active',
        huntCount: 0
      })

      // Clear caches
      this.clearRelatedCaches(request.orgSlug)

      console.log(`✅ OrgRegistryServiceV2: Organization ${request.orgSlug} created successfully`)
      return result

    } catch (error) {
      console.error(`❌ OrgRegistryServiceV2: Failed to create organization ${request.orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Add a hunt to an existing organization
   */
  async createHunt(orgSlug: string, request: CreateHuntRequest): Promise<{ data: Hunt; etag?: string }> {
    try {
      console.log(`🎯 OrgRegistryServiceV2: Creating hunt for ${orgSlug}:`, {
        huntName: request.huntName,
        startDate: request.startDate,
        createdBy: request.createdBy
      })

      // Load existing org data
      const orgResult = await this.loadOrg(orgSlug)
      const orgData = orgResult.data

      // Create hunt structure
      const newHunt = this.buildNewHunt(request)

      // Add hunt to organization
      orgData.hunts.push(newHunt)
      orgData.updatedAt = new Date().toISOString()

      // Save via adapter
      const etag = await this.orgRepo.upsertOrg({
        orgSlug,
        orgData,
        expectedEtag: orgResult.etag
      })

      // Update date index in App JSON
      await this.updateDateIndex(request.startDate, orgSlug, newHunt.id)

      // Clear caches
      this.clearRelatedCaches(orgSlug)

      console.log(`✅ OrgRegistryServiceV2: Hunt ${newHunt.id} created for ${orgSlug}`)
      return { data: newHunt, etag }

    } catch (error) {
      console.error(`❌ OrgRegistryServiceV2: Failed to create hunt for ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Update organization details
   */
  async updateOrganization(orgSlug: string, updates: Partial<{
    orgName: string
    contacts: Array<{ firstName: string; lastName: string; email: string }>
    settings: Record<string, any>
  }>): Promise<{ data: OrgData; etag?: string }> {
    try {
      console.log(`🔄 OrgRegistryServiceV2: Updating organization ${orgSlug}`)

      // Load existing data
      const orgResult = await this.loadOrg(orgSlug)
      const orgData = { ...orgResult.data }

      // Apply updates
      if (updates.orgName) orgData.org.orgName = updates.orgName
      if (updates.contacts) orgData.org.contacts = updates.contacts
      if (updates.settings) orgData.org.settings = { ...orgData.org.settings, ...updates.settings }
      
      orgData.updatedAt = new Date().toISOString()

      // Save via adapter
      const etag = await this.orgRepo.upsertOrg({
        orgSlug,
        orgData,
        expectedEtag: orgResult.etag
      })

      // Clear caches
      this.clearRelatedCaches(orgSlug)

      console.log(`✅ OrgRegistryServiceV2: Organization ${orgSlug} updated successfully`)
      return { data: orgData, etag }

    } catch (error) {
      console.error(`❌ OrgRegistryServiceV2: Failed to update organization ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * List all organizations with enhanced filtering
   */
  async listOrganizations(options?: {
    status?: string
    limit?: number
    includeHuntCount?: boolean
  }): Promise<OrganizationSummary[]> {
    try {
      console.log('📋 OrgRegistryServiceV2: Listing organizations:', options)

      const appResult = await this.loadApp()
      let organizations = appResult.data.organizations

      // Apply filters
      if (options?.status) {
        organizations = organizations.filter(org => org.status === options.status)
      }

      if (options?.limit) {
        organizations = organizations.slice(0, options.limit)
      }

      // Enhance with hunt counts if requested
      if (options?.includeHuntCount) {
        for (const org of organizations) {
          try {
            const orgData = await this.loadOrg(org.orgSlug)
            org.huntCount = orgData.data.hunts.length
          } catch (error) {
            console.warn(`⚠️ Failed to load hunt count for ${org.orgSlug}:`, error)
            org.huntCount = 0
          }
        }
      }

      console.log(`✅ OrgRegistryServiceV2: Found ${organizations.length} organizations`)
      return organizations

    } catch (error) {
      console.error('❌ OrgRegistryServiceV2: Failed to list organizations:', error)
      throw error
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      service: 'OrgRegistryServiceV2',
      adapters: {
        orgRepo: { status: 'unknown' as 'ok' | 'error', error: null as string | null }
      },
      cache: {
        enabled: this.config.enableCaching,
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      config: this.config,
      overall: 'unknown' as 'healthy' | 'degraded' | 'unhealthy'
    }

    // Test org repo
    try {
      await this.orgRepo.listOrgs({ limit: 1 })
      status.adapters.orgRepo.status = 'ok'
      status.overall = 'healthy'
    } catch (error) {
      status.adapters.orgRepo.status = 'error'
      status.adapters.orgRepo.error = error instanceof Error ? error.message : String(error)
      status.overall = 'unhealthy'
    }

    return status
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 OrgRegistryServiceV2: Cache cleared')
  }

  /**
   * Static utility methods (preserved for compatibility)
   */
  static generateHuntSlug(huntName: string): string {
    return slugify(huntName)
  }

  static generateHuntId(huntName: string, startDate: string): string {
    const slug = this.generateHuntSlug(huntName)
    const dateStr = startDate.replace(/-/g, '')
    return `${slug}-${dateStr}`
  }

  static getOrgKey(orgSlug: string): string {
    return `orgs/${orgSlug}.json`
  }

  /**
   * Helper: Build new organization data structure
   */
  private buildNewOrgData(request: CreateOrgRequest): OrgData {
    return {
      schemaVersion: '1.2.0',
      updatedAt: new Date().toISOString(),
      org: {
        orgSlug: request.orgSlug,
        orgName: request.orgName,
        contacts: request.contacts,
        settings: {
          defaultTeams: ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE'],
          timezone: 'America/Denver',
          locale: 'en-US',
          ...request.settings
        }
      },
      hunts: []
    }
  }

  /**
   * Helper: Build new hunt structure
   */
  private buildNewHunt(request: CreateHuntRequest): Hunt {
    const huntSlug = OrgRegistryServiceV2.generateHuntSlug(request.huntName)
    const huntId = OrgRegistryServiceV2.generateHuntId(request.huntName, request.startDate)

    return {
      id: huntId,
      slug: huntSlug,
      name: request.huntName,
      startDate: request.startDate,
      endDate: request.endDate,
      ...(request.location && { location: request.location }),
      status: 'scheduled',
      access: {
        visibility: request.options?.visibility || 'public',
        pinRequired: request.options?.pinRequired || false
      },
      scoring: {
        basePerStop: request.options?.basePerStop || 10,
        bonusCreative: request.options?.bonusCreative || 5
      },
      moderation: {
        required: request.options?.moderationRequired || false,
        reviewers: []
      },
      stops: [],
      audit: {
        createdBy: request.createdBy,
        createdAt: new Date().toISOString()
      }
    }
  }

  /**
   * Helper: Add organization to App JSON registry
   */
  private async addOrganizationToApp(orgSlug: string, orgSummary: OrganizationSummary): Promise<void> {
    const appResult = await this.loadApp()
    const appData = { ...appResult.data }

    const existingIndex = appData.organizations.findIndex(org => org.orgSlug === orgSlug)
    
    if (existingIndex >= 0) {
      appData.organizations[existingIndex] = orgSummary
    } else {
      appData.organizations.push(orgSummary)
    }

    appData.updatedAt = new Date().toISOString()

    // Save via adapter
    await this.orgRepo.upsertApp({
      appData,
      expectedEtag: appResult.etag
    })
  }

  /**
   * Helper: Update date index for hunt lookup
   */
  private async updateDateIndex(dateStr: string, orgSlug: string, huntId: string): Promise<void> {
    const appResult = await this.loadApp()
    const appData = { ...appResult.data }

    if (!appData.byDate) appData.byDate = {}
    if (!appData.byDate[dateStr]) appData.byDate[dateStr] = []

    const existingIndex = appData.byDate[dateStr].findIndex(
      entry => entry.orgSlug === orgSlug && entry.huntId === huntId
    )

    const indexEntry: HuntIndexEntry = { orgSlug, huntId }

    if (existingIndex >= 0) {
      appData.byDate[dateStr][existingIndex] = indexEntry
    } else {
      appData.byDate[dateStr].push(indexEntry)
    }

    appData.updatedAt = new Date().toISOString()

    // Save via adapter
    await this.orgRepo.upsertApp({
      appData,
      expectedEtag: appResult.etag
    })
  }

  /**
   * Helper: Clear related caches
   */
  private clearRelatedCaches(orgSlug: string): void {
    this.cache.delete('app')
    this.cache.delete(`org:${orgSlug}`)
  }
}

/**
 * Default service instance for backward compatibility
 */
export const orgRegistryServiceV2 = new OrgRegistryServiceV2()

/**
 * Legacy compatibility function
 */
export async function createLegacyOrgRegistryService(): Promise<OrgRegistryServiceV2> {
  console.log('🔄 Legacy createOrgRegistryService called, returning OrgRegistryServiceV2')
  return orgRegistryServiceV2
}