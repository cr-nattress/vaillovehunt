/**
 * OrgRegistryService - High-level service for managing App JSON and Org JSON data
 * Handles CRUD operations, organization management, and date indexing
 */

import { blobService, BlobResult } from './BlobService'
import { 
  AppData, 
  OrganizationSummary,
  HuntIndexEntry 
} from '../types/appData.schemas'
import { 
  OrgData, 
  Hunt 
} from '../types/orgData.schemas'
import { slugify } from '../utils/slug'
import { validateAppData, validateOrgData, type ValidationOptions } from '../schemas/validation/index'

export class OrgRegistryService {
  private static instance: OrgRegistryService
  private static readonly APP_KEY = 'app.json'
  
  static getInstance(): OrgRegistryService {
    if (!OrgRegistryService.instance) {
      OrgRegistryService.instance = new OrgRegistryService()
    }
    return OrgRegistryService.instance
  }

  /**
   * Generate organization blob key
   */
  static getOrgKey(orgSlug: string): string {
    return `orgs/${orgSlug}.json`
  }

  /**
   * Generate hunt slug from name
   */
  static generateHuntSlug(huntName: string): string {
    return slugify(huntName)
  }

  /**
   * Generate hunt ID from name and date
   */
  static generateHuntId(huntName: string, startDate: string): string {
    const slug = this.generateHuntSlug(huntName)
    const dateStr = startDate.replace(/-/g, '')
    return `${slug}-${dateStr}`
  }

  /**
   * Load App JSON data with comprehensive validation and migration
   */
  async loadApp(): Promise<BlobResult<AppData>> {
    try {
      const result = await blobService.readJson<any>(OrgRegistryService.APP_KEY)
      
      // Use comprehensive validation with migration
      const validation = await validateAppData(result.data, { 
        autoMigrate: true,
        includeWarnings: true 
      })
      
      if (!validation.success) {
        console.error('❌ App JSON validation failed:', validation.errors)
        throw new Error(`App JSON validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }

      if (validation.migrationApplied) {
        console.log('🔄 App JSON migration applied:', validation.migrationDetails)
        // Auto-save migrated data back to blob
        await blobService.writeJson(OrgRegistryService.APP_KEY, validation.data, result.etag)
      }

      if (validation.warnings?.length) {
        console.warn('⚠️  App JSON validation warnings:', validation.warnings)
      }
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.warn(`App JSON not found or invalid, returning default structure:`, error)
      
      // Return a default app structure with latest schema version
      const defaultApp: AppData = {
        schemaVersion: '1.2.0', // Latest version
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Vail Hunt',
            environment: 'development'
          },
          features: {
            enableKVEvents: false,
            enableBlobEvents: false,
            enablePhotoUpload: true,
            enableMapPage: false,
            enableVideoUpload: true,
            enableAdvancedValidation: false
          },
          defaults: {
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        organizations: []
      }
      
      return { data: defaultApp }
    }
  }

  /**
   * Load Org JSON data with comprehensive validation and migration
   */
  async loadOrg(orgSlug: string): Promise<BlobResult<OrgData>> {
    try {
      const key = OrgRegistryService.getOrgKey(orgSlug)
      const result = await blobService.readJson<any>(key)
      
      // Use comprehensive validation with migration
      const validation = await validateOrgData(result.data, { 
        autoMigrate: true,
        includeWarnings: true 
      })
      
      if (!validation.success) {
        console.error(`❌ Org JSON validation failed for ${orgSlug}:`, validation.errors)
        throw new Error(`Org JSON validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }

      if (validation.migrationApplied) {
        console.log(`🔄 Org JSON migration applied for ${orgSlug}:`, validation.migrationDetails)
        // Auto-save migrated data back to blob
        await blobService.writeJson(key, validation.data, result.etag)
      }

      if (validation.warnings?.length) {
        console.warn(`⚠️  Org JSON validation warnings for ${orgSlug}:`, validation.warnings)
      }
      
      return {
        data: validation.data!,
        etag: result.etag
      }
    } catch (error) {
      console.error(`Failed to load org ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Upsert App JSON data with comprehensive validation
   */
  async upsertApp(appData: AppData, expectedEtag?: string): Promise<string | undefined> {
    try {
      // Update timestamp
      const updatedData = {
        ...appData,
        updatedAt: new Date().toISOString()
      }
      
      // Comprehensive validation
      const validation = await validateAppData(updatedData, { strict: true })
      
      if (!validation.success) {
        console.error('❌ App JSON validation failed before upsert:', validation.errors)
        throw new Error(`App JSON validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }

      const validatedData = validation.data!
      
      console.log('📝 OrgRegistryService: Writing App JSON:', {
        schemaVersion: validatedData.schemaVersion,
        organizationCount: validatedData.organizations.length,
        byDateEntries: validatedData.byDate ? Object.keys(validatedData.byDate).length : 0,
        features: validatedData.app.features,
        expectedEtag,
        timestamp: validatedData.updatedAt
      })
      console.log('📋 App JSON Full Data:', JSON.stringify(validatedData, null, 2))
      
      const result = await blobService.writeJson(
        OrgRegistryService.APP_KEY, 
        validatedData, 
        expectedEtag
      )
      
      console.log('✅ App JSON written successfully:', { newEtag: result.etag })
      return result.etag
    } catch (error) {
      console.error(`❌ Failed to upsert app data:`, error)
      throw error
    }
  }

  /**
   * Upsert Org JSON data with comprehensive validation
   */
  async upsertOrg(orgData: OrgData, orgSlug: string, expectedEtag?: string): Promise<string | undefined> {
    try {
      const key = OrgRegistryService.getOrgKey(orgSlug)
      
      // Update timestamp
      const updatedData = {
        ...orgData,
        updatedAt: new Date().toISOString()
      }
      
      // Comprehensive validation
      const validation = await validateOrgData(updatedData, { strict: true })
      
      if (!validation.success) {
        console.error(`❌ Org JSON validation failed for ${orgSlug}:`, validation.errors)
        throw new Error(`Org JSON validation failed: ${validation.errors?.map(e => e.message).join(', ')}`)
      }

      const validatedData = validation.data!
      
      console.log(`📝 OrgRegistryService: Writing Org JSON for ${orgSlug}:`, {
        orgSlug: validatedData.org.orgSlug,
        orgName: validatedData.org.orgName,
        contactCount: validatedData.org.contacts.length,
        huntCount: validatedData.hunts.length,
        hunts: validatedData.hunts.map(h => ({ id: h.id, name: h.name, status: h.status })),
        expectedEtag,
        timestamp: validatedData.updatedAt,
        key
      })
      console.log(`📋 Org JSON Full Data for ${orgSlug}:`, JSON.stringify(validatedData, null, 2))
      
      const result = await blobService.writeJson(key, validatedData, expectedEtag)
      
      console.log(`✅ Org JSON written successfully for ${orgSlug}:`, { newEtag: result.etag })
      return result.etag
    } catch (error) {
      console.error(`❌ Failed to upsert org ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Add or update organization in App JSON
   */
  async addOrganization(appData: AppData, orgSummary: OrganizationSummary): Promise<AppData> {
    const existingIndex = appData.organizations.findIndex(
      org => org.orgSlug === orgSummary.orgSlug
    )
    
    if (existingIndex >= 0) {
      // Update existing organization
      console.log(`🔄 OrgRegistryService: Updating existing organization in App JSON:`, {
        orgSlug: orgSummary.orgSlug,
        oldData: appData.organizations[existingIndex],
        newData: orgSummary
      })
      appData.organizations[existingIndex] = orgSummary
    } else {
      // Add new organization
      console.log(`➕ OrgRegistryService: Adding new organization to App JSON:`, {
        orgSlug: orgSummary.orgSlug,
        orgName: orgSummary.orgName,
        contactEmail: orgSummary.contactEmail,
        status: orgSummary.status,
        totalOrganizations: appData.organizations.length + 1
      })
      appData.organizations.push(orgSummary)
    }
    
    return appData
  }

  /**
   * Add hunt to organization
   */
  async addHuntToOrg(orgData: OrgData, hunt: Hunt): Promise<OrgData> {
    const existingIndex = orgData.hunts.findIndex(h => h.id === hunt.id)
    
    if (existingIndex >= 0) {
      // Update existing hunt
      console.log(`🔄 OrgRegistryService: Updating existing hunt in Org JSON:`, {
        orgSlug: orgData.org.orgSlug,
        huntId: hunt.id,
        huntName: hunt.name,
        oldStatus: orgData.hunts[existingIndex].status,
        newStatus: hunt.status,
        oldStopCount: orgData.hunts[existingIndex].stops?.length || 0,
        newStopCount: hunt.stops?.length || 0
      })
      orgData.hunts[existingIndex] = hunt
    } else {
      // Add new hunt
      console.log(`➕ OrgRegistryService: Adding new hunt to Org JSON:`, {
        orgSlug: orgData.org.orgSlug,
        huntId: hunt.id,
        huntName: hunt.name,
        status: hunt.status,
        startDate: hunt.startDate,
        endDate: hunt.endDate,
        stopCount: hunt.stops?.length || 0,
        teamCount: hunt.teams?.length || 0,
        totalHunts: orgData.hunts.length + 1
      })
      orgData.hunts.push(hunt)
    }
    
    return orgData
  }

  /**
   * Update date index for fast "today's hunts" lookup
   */
  async updateByDateIndex(
    appData: AppData, 
    dateStr: string, 
    orgSlug: string, 
    huntId: string
  ): Promise<AppData> {
    if (!appData.byDate) {
      console.log(`📅 OrgRegistryService: Creating new date index in App JSON`)
      appData.byDate = {}
    }
    
    if (!appData.byDate[dateStr]) {
      console.log(`📅 OrgRegistryService: Creating date entry for ${dateStr} in App JSON`)
      appData.byDate[dateStr] = []
    }
    
    const existingIndex = appData.byDate[dateStr].findIndex(
      entry => entry.orgSlug === orgSlug && entry.huntId === huntId
    )
    
    const indexEntry: HuntIndexEntry = { orgSlug, huntId }
    
    if (existingIndex >= 0) {
      // Update existing entry
      console.log(`🔄 OrgRegistryService: Updating existing date index entry:`, {
        date: dateStr,
        orgSlug,
        huntId,
        existingIndex,
        totalEntriesForDate: appData.byDate[dateStr].length
      })
      appData.byDate[dateStr][existingIndex] = indexEntry
    } else {
      // Add new entry
      console.log(`➕ OrgRegistryService: Adding new date index entry:`, {
        date: dateStr,
        orgSlug,
        huntId,
        totalEntriesForDate: appData.byDate[dateStr].length + 1,
        allDatesWithEntries: Object.keys(appData.byDate)
      })
      appData.byDate[dateStr].push(indexEntry)
    }
    
    return appData
  }

  /**
   * Create a new organization with default structure
   */
  createNewOrg(
    orgSlug: string,
    orgName: string,
    contacts: { firstName: string, lastName: string, email: string }[]
  ): OrgData {
    const newOrg = {
      schemaVersion: '1.0.0',
      updatedAt: new Date().toISOString(),
      org: {
        orgSlug,
        orgName,
        contacts,
        settings: {
          defaultTeams: ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']
        }
      },
      hunts: []
    }
    
    console.log(`🏢 OrgRegistryService: Created new organization:`, {
      orgSlug,
      orgName,
      contactCount: contacts.length,
      contacts: contacts.map(c => `${c.firstName} ${c.lastName} <${c.email}>`),
      defaultTeams: newOrg.org.settings.defaultTeams,
      timestamp: newOrg.updatedAt
    })
    console.log(`📋 New Org Full Data:`, JSON.stringify(newOrg, null, 2))
    
    return newOrg
  }

  /**
   * Create a new hunt with default structure
   */
  createNewHunt(
    huntName: string,
    startDate: string,
    endDate: string,
    createdBy: string,
    location?: { city: string; state: string; zip: string }
  ): Hunt {
    const huntSlug = OrgRegistryService.generateHuntSlug(huntName)
    const huntId = OrgRegistryService.generateHuntId(huntName, startDate)
    
    const newHunt = {
      id: huntId,
      slug: huntSlug,
      name: huntName,
      startDate,
      endDate,
      ...(location && { location }),
      status: 'scheduled' as const,
      access: {
        visibility: 'public' as const,
        pinRequired: false
      },
      scoring: {
        basePerStop: 10,
        bonusCreative: 5
      },
      moderation: {
        required: false,
        reviewers: []
      },
      stops: [],
      audit: {
        createdBy,
        createdAt: new Date().toISOString()
      }
    }
    
    console.log(`🎯 OrgRegistryService: Created new hunt:`, {
      huntId,
      huntSlug,
      huntName,
      startDate,
      endDate,
      status: newHunt.status,
      visibility: newHunt.access.visibility,
      pinRequired: newHunt.access.pinRequired,
      basePerStop: newHunt.scoring.basePerStop,
      bonusCreative: newHunt.scoring.bonusCreative,
      createdBy,
      createdAt: newHunt.audit.createdAt
    })
    console.log(`📋 New Hunt Full Data:`, JSON.stringify(newHunt, null, 2))
    
    return newHunt
  }
}

// Export singleton instance
export const orgRegistryService = OrgRegistryService.getInstance()
export default OrgRegistryService