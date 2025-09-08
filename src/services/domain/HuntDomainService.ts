/**
 * Hunt Domain Service - Phase 5 Business Logic Layer
 * 
 * Provides high-level business operations that orchestrate multiple services.
 * Encapsulates complex business logic and provides a clean API for controllers.
 */

import { EventServiceV2 } from '../EventServiceV2'
import { OrgRegistryServiceV2 } from '../OrgRegistryServiceV2'
import type { OrgEvent } from '../EventServiceV2'
import type { CreateOrgRequest, CreateHuntRequest } from '../OrgRegistryServiceV2'
import type { Hunt, OrgData } from '../../types/orgData.schemas'

/**
 * Complete hunt with organization context
 */
export interface HuntWithContext {
  hunt: Hunt
  organization: {
    slug: string
    name: string
    contacts: Array<{ firstName: string; lastName: string; email: string }>
    settings: Record<string, any>
  }
  metadata: {
    schemaVersion: string
    lastUpdated: string
    participantCount: number
    completionRate?: number
  }
}

/**
 * Hunt creation result
 */
export interface HuntCreationResult {
  hunt: Hunt
  organization: OrgData
  dateIndexUpdated: boolean
  etags: {
    org?: string
    app?: string
  }
}

/**
 * Organization analytics
 */
export interface OrganizationAnalytics {
  totalHunts: number
  activeHunts: number
  completedHunts: number
  scheduledHunts: number
  totalStops: number
  totalTeams: number
  avgStopsPerHunt: number
  recentActivity: Array<{
    date: string
    action: string
    huntId: string
    huntName: string
  }>
}

/**
 * Business logic configuration
 */
interface DomainServiceConfig {
  enableAnalytics: boolean
  enableCaching: boolean
  maxHuntsPerOrg: number
  defaultHuntDurationDays: number
}

/**
 * Hunt Domain Service implementing business logic
 */
export class HuntDomainService {
  private eventService: EventServiceV2
  private orgService: OrgRegistryServiceV2
  private config: DomainServiceConfig

  constructor(config?: Partial<DomainServiceConfig>) {
    this.eventService = new EventServiceV2()
    this.orgService = new OrgRegistryServiceV2()
    
    this.config = {
      enableAnalytics: true,
      enableCaching: true,
      maxHuntsPerOrg: 50,
      defaultHuntDurationDays: 1,
      ...config
    }

    console.log('🎯 HuntDomainService initialized:', {
      config: this.config
    })
  }

  /**
   * Get today's events with rich context
   */
  async getTodaysHunts(options?: {
    orgSlug?: string
    status?: 'scheduled' | 'active' | 'completed' | 'archived'
    includeContext?: boolean
  }): Promise<OrgEvent[]> {
    try {
      console.log('📅 HuntDomainService: Getting today\'s hunts:', options)

      const events = await this.eventService.fetchTodaysEvents({
        orgSlug: options?.orgSlug,
        status: options?.status
      })

      // Enhance with additional context if requested
      if (options?.includeContext) {
        for (const event of events) {
          try {
            const orgData = await this.orgService.loadOrg(event.orgSlug)
            event.data = {
              ...event.data,
              organization: {
                name: orgData.data.org.orgName,
                contactCount: orgData.data.org.contacts.length,
                totalHunts: orgData.data.hunts.length
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to enhance context for ${event.orgSlug}:`, error)
          }
        }
      }

      console.log(`✅ HuntDomainService: Retrieved ${events.length} hunts for today`)
      return events

    } catch (error) {
      console.error('❌ HuntDomainService: Failed to get today\'s hunts:', error)
      throw error
    }
  }

  /**
   * Create a complete hunt with organization setup
   */
  async createCompleteHunt(
    orgSlug: string,
    huntRequest: CreateHuntRequest,
    orgRequest?: CreateOrgRequest
  ): Promise<HuntCreationResult> {
    try {
      console.log(`🏗️ HuntDomainService: Creating complete hunt for ${orgSlug}`)

      let orgData: OrgData
      let orgEtag: string | undefined

      // Create organization if it doesn't exist
      try {
        const orgResult = await this.orgService.loadOrg(orgSlug)
        orgData = orgResult.data
        orgEtag = orgResult.etag
      } catch (error) {
        if (orgRequest) {
          console.log(`🏢 Creating new organization ${orgSlug}`)
          const createResult = await this.orgService.createOrganization({
            orgSlug,
            ...orgRequest
          })
          orgData = createResult.data
          orgEtag = createResult.etag
        } else {
          throw new Error(`Organization ${orgSlug} does not exist and no creation data provided`)
        }
      }

      // Business rule: Check hunt limits
      if (orgData.hunts.length >= this.config.maxHuntsPerOrg) {
        throw new Error(`Organization ${orgSlug} has reached maximum hunt limit of ${this.config.maxHuntsPerOrg}`)
      }

      // Business rule: Validate hunt dates
      this.validateHuntDates(huntRequest.startDate, huntRequest.endDate)

      // Create the hunt
      const huntResult = await this.orgService.createHunt(orgSlug, huntRequest)

      // Reload org data to get updated state
      const updatedOrgResult = await this.orgService.loadOrg(orgSlug)

      console.log(`✅ HuntDomainService: Complete hunt creation successful for ${huntResult.data.id}`)

      return {
        hunt: huntResult.data,
        organization: updatedOrgResult.data,
        dateIndexUpdated: true,
        etags: {
          org: huntResult.etag,
          app: undefined // App etag would be updated by the service
        }
      }

    } catch (error) {
      console.error(`❌ HuntDomainService: Failed to create complete hunt for ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Get hunt with full context and analytics
   */
  async getHuntWithContext(orgSlug: string, huntId: string): Promise<HuntWithContext> {
    try {
      console.log(`📖 HuntDomainService: Getting hunt with context: ${orgSlug}/${huntId}`)

      // Get detailed event information
      const eventDetails = await this.eventService.getEventDetails(orgSlug, huntId)
      
      // Load organization data
      const orgResult = await this.orgService.loadOrg(orgSlug)
      const orgData = orgResult.data

      // Find the specific hunt
      const hunt = orgData.hunts.find(h => h.id === huntId)
      if (!hunt) {
        throw new Error(`Hunt ${huntId} not found in organization ${orgSlug}`)
      }

      // Build context
      const huntWithContext: HuntWithContext = {
        hunt,
        organization: {
          slug: orgData.org.orgSlug,
          name: orgData.org.orgName,
          contacts: orgData.org.contacts,
          settings: orgData.org.settings
        },
        metadata: {
          schemaVersion: orgData.schemaVersion,
          lastUpdated: orgData.updatedAt,
          participantCount: hunt.teams?.length || 0
        }
      }

      // Add analytics if enabled
      if (this.config.enableAnalytics) {
        huntWithContext.metadata.completionRate = this.calculateCompletionRate(hunt)
      }

      console.log(`✅ HuntDomainService: Retrieved hunt context for ${huntId}`)
      return huntWithContext

    } catch (error) {
      console.error(`❌ HuntDomainService: Failed to get hunt context for ${orgSlug}/${huntId}:`, error)
      throw error
    }
  }

  /**
   * Get organization analytics and insights
   */
  async getOrganizationAnalytics(orgSlug: string): Promise<OrganizationAnalytics> {
    try {
      console.log(`📊 HuntDomainService: Getting analytics for ${orgSlug}`)

      const orgResult = await this.orgService.loadOrg(orgSlug)
      const orgData = orgResult.data

      const hunts = orgData.hunts
      const analytics: OrganizationAnalytics = {
        totalHunts: hunts.length,
        activeHunts: hunts.filter(h => h.status === 'active').length,
        completedHunts: hunts.filter(h => h.status === 'completed').length,
        scheduledHunts: hunts.filter(h => h.status === 'scheduled').length,
        totalStops: hunts.reduce((sum, h) => sum + (h.stops?.length || 0), 0),
        totalTeams: hunts.reduce((sum, h) => sum + (h.teams?.length || 0), 0),
        avgStopsPerHunt: 0,
        recentActivity: []
      }

      // Calculate averages
      if (analytics.totalHunts > 0) {
        analytics.avgStopsPerHunt = Math.round(analytics.totalStops / analytics.totalHunts * 100) / 100
      }

      // Generate recent activity (last 10 hunts)
      analytics.recentActivity = hunts
        .sort((a, b) => new Date(b.audit?.createdAt || '').getTime() - new Date(a.audit?.createdAt || '').getTime())
        .slice(0, 10)
        .map(hunt => ({
          date: hunt.audit?.createdAt || hunt.startDate,
          action: 'created',
          huntId: hunt.id,
          huntName: hunt.name
        }))

      console.log(`✅ HuntDomainService: Analytics calculated for ${orgSlug}:`, {
        totalHunts: analytics.totalHunts,
        activeHunts: analytics.activeHunts,
        avgStopsPerHunt: analytics.avgStopsPerHunt
      })

      return analytics

    } catch (error) {
      console.error(`❌ HuntDomainService: Failed to get analytics for ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Archive completed hunts (business rule)
   */
  async archiveOldHunts(cutoffDate: Date): Promise<{
    archivedCount: number
    organizations: string[]
  }> {
    try {
      console.log('📦 HuntDomainService: Archiving old hunts before:', cutoffDate.toISOString())

      const organizations = await this.orgService.listOrganizations()
      let archivedCount = 0
      const affectedOrgs: string[] = []

      for (const orgSummary of organizations) {
        try {
          const orgResult = await this.orgService.loadOrg(orgSummary.orgSlug)
          const orgData = orgResult.data
          let hasChanges = false

          // Find hunts to archive
          for (const hunt of orgData.hunts) {
            const huntEndDate = new Date(hunt.endDate)
            if (hunt.status === 'completed' && huntEndDate < cutoffDate) {
              hunt.status = 'archived'
              archivedCount++
              hasChanges = true
            }
          }

          // Save if changes were made
          if (hasChanges) {
            await this.orgService.updateOrganization(orgSummary.orgSlug, {})
            affectedOrgs.push(orgSummary.orgSlug)
          }

        } catch (error) {
          console.warn(`⚠️ Failed to archive hunts for ${orgSummary.orgSlug}:`, error)
        }
      }

      console.log(`✅ HuntDomainService: Archived ${archivedCount} hunts across ${affectedOrgs.length} organizations`)

      return {
        archivedCount,
        organizations: affectedOrgs
      }

    } catch (error) {
      console.error('❌ HuntDomainService: Failed to archive old hunts:', error)
      throw error
    }
  }

  /**
   * Get service health with dependency checks
   */
  async getHealthStatus() {
    const [eventServiceHealth, orgServiceHealth] = await Promise.all([
      this.eventService.getHealthStatus(),
      this.orgService.getHealthStatus()
    ])

    const overallHealth = 
      eventServiceHealth.overall === 'healthy' && orgServiceHealth.overall === 'healthy'
        ? 'healthy'
        : eventServiceHealth.overall === 'unhealthy' || orgServiceHealth.overall === 'unhealthy'
        ? 'unhealthy'
        : 'degraded'

    return {
      timestamp: new Date().toISOString(),
      service: 'HuntDomainService',
      dependencies: {
        eventService: eventServiceHealth,
        orgService: orgServiceHealth
      },
      config: this.config,
      overall: overallHealth
    }
  }

  /**
   * Clear all service caches
   */
  clearCaches(): void {
    this.eventService.clearCache()
    this.orgService.clearCache()
    console.log('🧹 HuntDomainService: All service caches cleared')
  }

  /**
   * Helper: Validate hunt dates according to business rules
   */
  private validateHuntDates(startDate: string, endDate: string): void {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start < now) {
      console.warn('⚠️ Hunt start date is in the past, but allowing for testing')
      // In production, you might want to throw an error here
    }

    if (end < start) {
      throw new Error('Hunt end date must be after start date')
    }

    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (duration > 30) {
      throw new Error('Hunt duration cannot exceed 30 days')
    }
  }

  /**
   * Helper: Calculate hunt completion rate
   */
  private calculateCompletionRate(hunt: Hunt): number {
    if (!hunt.stops || hunt.stops.length === 0) return 0
    if (!hunt.teams || hunt.teams.length === 0) return 0

    // This is a simplified calculation - in a real app you'd have submission data
    const totalPossibleSubmissions = hunt.stops.length * hunt.teams.length
    const estimatedCompletions = Math.floor(totalPossibleSubmissions * 0.7) // Simulate 70% completion
    
    return Math.round((estimatedCompletions / totalPossibleSubmissions) * 100)
  }
}

/**
 * Default domain service instance
 */
export const huntDomainService = new HuntDomainService()