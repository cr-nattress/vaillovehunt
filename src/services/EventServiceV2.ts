/**
 * Event Service V2 - Phase 5 Refactoring
 * 
 * Clean architecture implementation using the adapter system from Phase 4.
 * Replaces the complex multi-source logic with clean dependency injection.
 */

import { getEventRepo, getOrgRepo } from '../infra/registry'
import { getFlags } from '../config'
import type { EventRepoPort } from '../ports/event.repo.port'
import type { OrgRepoPort } from '../ports/org.repo.port'

/**
 * Event data structure for compatibility with existing API
 */
export interface OrgEvent {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  startAt?: string
  endAt?: string
  data?: {
    description?: string
    huntId?: string
    status?: string
    createdBy?: string
    createdAt?: string
    location?: {
      city?: string
      state?: string
    }
    stops?: number
    teams?: string[]
  }
}

/**
 * Event query options
 */
export interface EventQueryOptions {
  date?: string
  orgSlug?: string
  status?: 'scheduled' | 'active' | 'completed' | 'archived'
  limit?: number
  includeArchived?: boolean
}

/**
 * Event service configuration
 */
interface EventServiceConfig {
  enableCaching: boolean
  cacheExpiryMs: number
  maxRetries: number
  fallbackToMocks: boolean
}

/**
 * Event Service V2 using clean architecture
 */
export class EventServiceV2 {
  private eventRepo: EventRepoPort
  private orgRepo: OrgRepoPort
  private config: EventServiceConfig
  private cache: Map<string, { data: OrgEvent[]; expiry: number }> = new Map()

  constructor(config?: Partial<EventServiceConfig>) {
    // Dependency injection via adapter registry
    this.eventRepo = getEventRepo()
    this.orgRepo = getOrgRepo()
    
    this.config = {
      enableCaching: true,
      cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      fallbackToMocks: true,
      ...config
    }

    console.log('🎯 EventServiceV2 initialized:', {
      eventRepo: this.eventRepo.constructor.name,
      orgRepo: this.orgRepo.constructor.name,
      config: this.config
    })
  }

  /**
   * Fetch today's events with clean error handling
   */
  async fetchTodaysEvents(options: EventQueryOptions = {}): Promise<OrgEvent[]> {
    const dateStr = options.date || this.formatDateYYYYMMDD(new Date())
    const cacheKey = `events:${dateStr}:${JSON.stringify(options)}`

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cached = this.cache.get(cacheKey)
        if (cached && Date.now() < cached.expiry) {
          console.log(`💾 EventServiceV2: Using cached events for ${dateStr}`)
          return this.filterEvents(cached.data, options)
        }
      }

      console.log(`📅 EventServiceV2: Fetching events for ${dateStr}`)

      // Fetch events through adapter
      const eventSummaries = await this.eventRepo.listToday({
        date: dateStr,
        limit: options.limit
      })

      // Convert to OrgEvent format with organization context
      const events: OrgEvent[] = []
      
      for (const summary of eventSummaries) {
        try {
          // Get full event details
          const event = await this.eventRepo.getEvent({
            orgSlug: summary.orgSlug,
            huntId: summary.huntId
          })

          // Convert to OrgEvent format
          const orgEvent: OrgEvent = {
            key: `events/${event.startDate}/${event.orgSlug}`,
            orgSlug: event.orgSlug,
            orgName: summary.huntName, // Will be enhanced with org details below
            eventName: event.huntName,
            startAt: event.startDate,
            endAt: event.endDate,
            data: {
              description: `${event.huntName}`,
              huntId: event.huntId,
              status: event.status,
              location: event.location ? {
                city: event.location.city,
                state: event.location.state
              } : undefined,
              stops: event.stops?.length || 0,
              teams: event.teams || []
            }
          }

          // Enhance with organization context
          try {
            const orgResult = await this.orgRepo.getOrg({ orgSlug: event.orgSlug })
            orgEvent.orgName = orgResult.data.org.orgName
            orgEvent.data!.description = `${event.huntName} - ${orgResult.data.org.orgName}`
          } catch (orgError) {
            console.warn(`⚠️ Failed to load org context for ${event.orgSlug}:`, orgError)
          }

          events.push(orgEvent)

        } catch (eventError) {
          console.warn(`⚠️ Failed to load event ${summary.huntId} for ${summary.orgSlug}:`, eventError)
        }
      }

      // Sort by organization name for consistency
      events.sort((a, b) => a.orgName.localeCompare(b.orgName))

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: events,
          expiry: Date.now() + this.config.cacheExpiryMs
        })
      }

      console.log(`✅ EventServiceV2: Found ${events.length} events for ${dateStr}`)
      return this.filterEvents(events, options)

    } catch (error) {
      console.error(`❌ EventServiceV2: Failed to fetch events for ${dateStr}:`, error)

      // Fallback to mocks if enabled and appropriate
      if (this.config.fallbackToMocks && this.shouldFallbackToMocks()) {
        console.log('🎭 EventServiceV2: Falling back to mock events')
        return this.getMockEvents(dateStr, options)
      }

      throw error
    }
  }

  /**
   * Get detailed event information
   */
  async getEventDetails(orgSlug: string, huntId: string) {
    try {
      console.log(`📖 EventServiceV2: Getting event details for ${orgSlug}/${huntId}`)

      // Get event details
      const event = await this.eventRepo.getEvent({ orgSlug, huntId })

      // Get organization context
      const orgResult = await this.orgRepo.getOrg({ orgSlug })
      const org = orgResult.data

      // Combine with rich context
      const eventDetails = {
        ...event,
        organization: {
          name: org.org.orgName,
          slug: org.org.orgSlug,
          contacts: org.org.contacts,
          settings: org.org.settings
        },
        metadata: {
          schemaVersion: org.schemaVersion,
          lastUpdated: org.updatedAt,
          dataSource: this.eventRepo.constructor.name
        },
        analytics: {
          stopsCount: event.stops?.length || 0,
          teamsCount: event.teams?.length || 0,
          rulesLength: event.rules?.length || 0
        }
      }

      console.log(`✅ EventServiceV2: Retrieved detailed event: ${event.huntName}`)
      return eventDetails

    } catch (error) {
      console.error(`❌ EventServiceV2: Failed to get event details for ${orgSlug}/${huntId}:`, error)
      throw error
    }
  }

  /**
   * List all events for an organization
   */
  async getOrgEvents(orgSlug: string, options: EventQueryOptions = {}) {
    try {
      console.log(`🏢 EventServiceV2: Getting events for org ${orgSlug}`)

      // Get organization data which contains all hunts
      const orgResult = await this.orgRepo.getOrg({ orgSlug })
      const org = orgResult.data

      // Convert hunts to OrgEvent format
      let events: OrgEvent[] = org.hunts.map(hunt => ({
        key: `events/${hunt.startDate}/${orgSlug}`,
        orgSlug: orgSlug,
        orgName: org.org.orgName,
        eventName: hunt.name,
        startAt: hunt.startDate,
        endAt: hunt.endDate,
        data: {
          description: `${hunt.name} - ${org.org.orgName}`,
          huntId: hunt.id,
          status: hunt.status,
          location: hunt.location ? {
            city: hunt.location.city,
            state: hunt.location.state
          } : undefined,
          stops: hunt.stops?.length || 0,
          teams: hunt.teams?.map(t => t.name) || []
        }
      }))

      // Apply filtering
      events = this.filterEvents(events, options)

      console.log(`✅ EventServiceV2: Found ${events.length} events for org ${orgSlug}`)
      return events

    } catch (error) {
      console.error(`❌ EventServiceV2: Failed to get org events for ${orgSlug}:`, error)
      throw error
    }
  }

  /**
   * Clear cache (useful for testing and manual refresh)
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 EventServiceV2: Cache cleared')
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      service: 'EventServiceV2',
      adapters: {
        eventRepo: { status: 'unknown' as 'ok' | 'error', error: null as string | null },
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

    // Test event repo
    try {
      await this.eventRepo.listToday({ limit: 1 })
      status.adapters.eventRepo.status = 'ok'
    } catch (error) {
      status.adapters.eventRepo.status = 'error'
      status.adapters.eventRepo.error = error instanceof Error ? error.message : String(error)
    }

    // Test org repo
    try {
      await this.orgRepo.listOrgs({ limit: 1 })
      status.adapters.orgRepo.status = 'ok'
    } catch (error) {
      status.adapters.orgRepo.status = 'error'
      status.adapters.orgRepo.error = error instanceof Error ? error.message : String(error)
    }

    // Determine overall health
    const errorCount = Object.values(status.adapters).filter(a => a.status === 'error').length
    if (errorCount === 0) {
      status.overall = 'healthy'
    } else if (errorCount === Object.keys(status.adapters).length) {
      status.overall = 'unhealthy'
    } else {
      status.overall = 'degraded'
    }

    return status
  }

  /**
   * Helper: Format date to YYYY-MM-DD
   */
  private formatDateYYYYMMDD(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Helper: Filter events based on options
   */
  private filterEvents(events: OrgEvent[], options: EventQueryOptions): OrgEvent[] {
    let filtered = events.slice()

    // Filter by organization
    if (options.orgSlug) {
      filtered = filtered.filter(e => e.orgSlug === options.orgSlug)
    }

    // Filter by status
    if (options.status) {
      filtered = filtered.filter(e => e.data?.status === options.status)
    }

    // Filter archived events
    if (!options.includeArchived) {
      filtered = filtered.filter(e => e.data?.status !== 'archived')
    }

    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }

  /**
   * Helper: Determine if we should fallback to mocks
   */
  private shouldFallbackToMocks(): boolean {
    const flags = getFlags()
    // Only fallback to mocks in development or when explicitly enabled
    return flags.app.environment === 'development' || this.config.fallbackToMocks
  }

  /**
   * Helper: Generate mock events for fallback
   */
  private getMockEvents(dateStr: string, options: EventQueryOptions): OrgEvent[] {
    console.log('🎭 EventServiceV2: Generating mock events')
    
    const mockEvents: OrgEvent[] = [
      {
        key: `events/${dateStr}/mock-org`,
        orgSlug: 'mock-org',
        orgName: 'Mock Organization',
        eventName: 'Sample Hunt Event',
        startAt: dateStr,
        endAt: dateStr,
        data: {
          description: 'Sample Hunt Event - Mock Organization',
          huntId: 'sample-hunt',
          status: 'active',
          stops: 5,
          teams: ['RED', 'BLUE', 'GREEN']
        }
      }
    ]

    return this.filterEvents(mockEvents, options)
  }
}

/**
 * Default service instance for backward compatibility
 */
export const eventServiceV2 = new EventServiceV2()

/**
 * Legacy compatibility function
 */
export async function fetchTodaysEvents(baseUrl: string = ''): Promise<OrgEvent[]> {
  console.log('🔄 Legacy fetchTodaysEvents called, routing to EventServiceV2')
  return eventServiceV2.fetchTodaysEvents()
}