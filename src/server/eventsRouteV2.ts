/**
 * Events Route V2 - Phase 5 API Layer
 * 
 * Updated API endpoints using the new service layer architecture.
 * Provides clean RESTful endpoints backed by domain services.
 */

import { Request, Response, Router } from 'express'
import { huntDomainService } from '../services/domain'
import type { HuntCreationResult, OrganizationAnalytics } from '../services/domain'
import type { CreateHuntRequest, CreateOrgRequest } from '../services/OrgRegistryServiceV2'

/**
 * Enhanced event list item with additional context
 */
export interface EventListItemV2 {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  huntId: string
  startDate: string
  endDate?: string
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'
  metadata?: {
    stopCount?: number
    teamCount?: number
    participantCount?: number
    completionRate?: number
  }
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * Create standardized API response
 */
function createApiResponse<T>(data?: T, error?: string, message?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * GET /api/v2/events - Get today's events with enhanced data
 */
export const eventsListHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string || formatDateYYYYMMDD(new Date())
    const orgSlug = req.query.orgSlug as string
    const status = req.query.status as 'scheduled' | 'active' | 'completed' | 'archived'
    const includeContext = req.query.includeContext === 'true'

    console.log(`🗓️ EventsRouteV2: Fetching events for date: ${date}`, {
      orgSlug,
      status,
      includeContext
    })

    // Use domain service to get today's hunts
    const events = await huntDomainService.getTodaysHunts({
      orgSlug,
      status,
      includeContext
    })

    // Transform to API format
    const eventItems: EventListItemV2[] = events.map(event => ({
      key: event.key,
      orgSlug: event.orgSlug,
      orgName: event.orgName,
      eventName: event.eventName,
      huntId: event.data?.huntId || '',
      startDate: event.startAt || '',
      endDate: event.endAt,
      status: event.data?.status || 'scheduled',
      metadata: includeContext ? {
        stopCount: event.data?.stops,
        teamCount: event.data?.teams?.length,
        participantCount: event.data?.organization?.contactCount,
        completionRate: undefined // Would be calculated from actual submission data
      } : undefined
    }))

    console.log(`✅ EventsRouteV2: Returning ${eventItems.length} events for ${date}`)

    res.json(createApiResponse({
      date,
      events: eventItems,
      count: eventItems.length,
      filters: { orgSlug, status, includeContext }
    }))

  } catch (error) {
    console.error('❌ EventsRouteV2: Error in eventsListHandlerV2:', error)
    res.status(500).json(createApiResponse(
      undefined,
      'Failed to fetch events',
      error instanceof Error ? error.message : 'Unknown error'
    ))
  }
}

/**
 * GET /api/v2/events/all - Get all events across organizations
 */
export const eventsAllHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeContext = req.query.includeContext === 'true'
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const status = req.query.status as string

    console.log(`🗂️ EventsRouteV2: Fetching all events`, { includeContext, limit, status })

    // Get all organizations and their hunts
    const orgService = huntDomainService['orgService'] // Access private member for this operation
    const organizations = await orgService.listOrganizations({ 
      status,
      limit,
      includeHuntCount: true 
    })

    const allEvents: EventListItemV2[] = []

    // Load hunts for each organization
    for (const orgSummary of organizations) {
      try {
        const orgResult = await orgService.loadOrg(orgSummary.orgSlug)
        const org = orgResult.data

        for (const hunt of org.hunts) {
          const eventItem: EventListItemV2 = {
            key: `events/${hunt.startDate}/${orgSummary.orgSlug}/${hunt.id}`,
            orgSlug: orgSummary.orgSlug,
            orgName: org.org.orgName,
            eventName: hunt.name,
            huntId: hunt.id,
            startDate: hunt.startDate,
            endDate: hunt.endDate,
            status: hunt.status,
            metadata: includeContext ? {
              stopCount: hunt.stops?.length || 0,
              teamCount: hunt.teams?.length || 0,
              participantCount: org.org.contacts.length
            } : undefined
          }

          allEvents.push(eventItem)
        }
      } catch (orgError) {
        console.warn(`⚠️ EventsRouteV2: Error loading org ${orgSummary.orgSlug}:`, orgError)
      }
    }

    // Sort by organization name, then by event name
    allEvents.sort((a, b) => {
      const orgCompare = a.orgName.localeCompare(b.orgName)
      return orgCompare !== 0 ? orgCompare : a.eventName.localeCompare(b.eventName)
    })

    console.log(`✅ EventsRouteV2: Returning ${allEvents.length} total events`)

    res.json(createApiResponse({
      events: allEvents,
      count: allEvents.length,
      organizationCount: organizations.length,
      filters: { includeContext, limit, status }
    }))

  } catch (error) {
    console.error('❌ EventsRouteV2: Error in eventsAllHandlerV2:', error)
    res.status(500).json(createApiResponse(
      undefined,
      'Failed to fetch all events',
      error instanceof Error ? error.message : 'Unknown error'
    ))
  }
}

/**
 * GET /api/v2/events/:orgSlug/:huntId - Get event details with full context
 */
export const eventDetailsHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgSlug, huntId } = req.params

    console.log(`📖 EventsRouteV2: Getting event details for ${orgSlug}/${huntId}`)

    const huntWithContext = await huntDomainService.getHuntWithContext(orgSlug, huntId)

    res.json(createApiResponse({
      hunt: huntWithContext.hunt,
      organization: huntWithContext.organization,
      metadata: huntWithContext.metadata
    }))

  } catch (error) {
    console.error(`❌ EventsRouteV2: Error getting event details for ${req.params.orgSlug}/${req.params.huntId}:`, error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(createApiResponse(
        undefined,
        'Event not found',
        error.message
      ))
    } else {
      res.status(500).json(createApiResponse(
        undefined,
        'Failed to get event details',
        error instanceof Error ? error.message : 'Unknown error'
      ))
    }
  }
}

/**
 * POST /api/v2/events - Create a new hunt
 */
export const createEventHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgSlug, huntRequest, orgRequest } = req.body as {
      orgSlug: string
      huntRequest: CreateHuntRequest
      orgRequest?: CreateOrgRequest
    }

    console.log(`🏗️ EventsRouteV2: Creating hunt for ${orgSlug}:`, huntRequest.huntName)

    // Validate required fields
    if (!orgSlug || !huntRequest) {
      res.status(400).json(createApiResponse(
        undefined,
        'Missing required fields',
        'orgSlug and huntRequest are required'
      ))
      return
    }

    const result = await huntDomainService.createCompleteHunt(orgSlug, huntRequest, orgRequest)

    res.status(201).json(createApiResponse(result, undefined, 'Hunt created successfully'))

  } catch (error) {
    console.error(`❌ EventsRouteV2: Error creating hunt:`, error)

    if (error instanceof Error && (error.message.includes('limit') || error.message.includes('exceed'))) {
      res.status(400).json(createApiResponse(
        undefined,
        'Business rule violation',
        error.message
      ))
    } else {
      res.status(500).json(createApiResponse(
        undefined,
        'Failed to create hunt',
        error instanceof Error ? error.message : 'Unknown error'
      ))
    }
  }
}

/**
 * GET /api/v2/organizations/:orgSlug/analytics - Get organization analytics
 */
export const organizationAnalyticsHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgSlug } = req.params

    console.log(`📊 EventsRouteV2: Getting analytics for ${orgSlug}`)

    const analytics = await huntDomainService.getOrganizationAnalytics(orgSlug)

    res.json(createApiResponse(analytics))

  } catch (error) {
    console.error(`❌ EventsRouteV2: Error getting analytics for ${req.params.orgSlug}:`, error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(createApiResponse(
        undefined,
        'Organization not found',
        error.message
      ))
    } else {
      res.status(500).json(createApiResponse(
        undefined,
        'Failed to get organization analytics',
        error instanceof Error ? error.message : 'Unknown error'
      ))
    }
  }
}

/**
 * GET /api/v2/health - Service health check
 */
export const healthCheckHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🏥 EventsRouteV2: Health check requested')

    const health = await huntDomainService.getHealthStatus()

    const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503

    res.status(statusCode).json(createApiResponse(health))

  } catch (error) {
    console.error('❌ EventsRouteV2: Error in health check:', error)
    res.status(503).json(createApiResponse(
      undefined,
      'Health check failed',
      error instanceof Error ? error.message : 'Unknown error'
    ))
  }
}

/**
 * POST /api/v2/cache/clear - Clear all service caches (admin endpoint)
 */
export const clearCacheHandlerV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🧹 EventsRouteV2: Cache clear requested')

    huntDomainService.clearCaches()

    res.json(createApiResponse(
      { cleared: true },
      undefined,
      'All service caches cleared successfully'
    ))

  } catch (error) {
    console.error('❌ EventsRouteV2: Error clearing caches:', error)
    res.status(500).json(createApiResponse(
      undefined,
      'Failed to clear caches',
      error instanceof Error ? error.message : 'Unknown error'
    ))
  }
}

// Create router
const routerV2 = Router()

// Route definitions
routerV2.get('/events', eventsListHandlerV2)
routerV2.get('/events/all', eventsAllHandlerV2)
routerV2.get('/events/:orgSlug/:huntId', eventDetailsHandlerV2)
routerV2.post('/events', createEventHandlerV2)
routerV2.get('/organizations/:orgSlug/analytics', organizationAnalyticsHandlerV2)
routerV2.get('/health', healthCheckHandlerV2)
routerV2.post('/cache/clear', clearCacheHandlerV2)

export default routerV2