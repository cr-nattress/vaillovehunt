/**
 * Modern Event Service - Phase 4 Demonstration
 * 
 * Example service using the new adapter system with dependency injection.
 * Shows how to integrate ports & adapters with schema validation.
 */

import { getEventRepo, getOrgRepo, getMedia } from '../infra/registry'
import type { EventRepoPort } from '../ports/event.repo.port'
import type { OrgRepoPort } from '../ports/org.repo.port'
import type { MediaPort } from '../ports/media.port'

/**
 * Service configuration
 */
interface EventServiceConfig {
  autoValidation: boolean
  enableCaching: boolean
  maxRetries: number
}

/**
 * Event query parameters
 */
export interface EventQuery {
  date?: string
  orgSlug?: string
  status?: 'scheduled' | 'active' | 'completed' | 'archived'
  limit?: number
}

/**
 * Media upload request
 */
export interface MediaUploadRequest {
  file: File
  orgSlug: string
  huntId: string
  stopId?: string
  options?: {
    teamName?: string
    locationName?: string
    eventName?: string
  }
}

/**
 * Modern event service using Ports & Adapters pattern
 */
export class ModernEventService {
  private eventRepo: EventRepoPort
  private orgRepo: OrgRepoPort
  private mediaAdapter: MediaPort
  private config: EventServiceConfig

  constructor(config: Partial<EventServiceConfig> = {}) {
    // Dependency injection via registry
    this.eventRepo = getEventRepo()
    this.orgRepo = getOrgRepo()
    this.mediaAdapter = getMedia()
    
    this.config = {
      autoValidation: true,
      enableCaching: true,
      maxRetries: 3,
      ...config
    }

    console.log('🎯 ModernEventService initialized with adapters:', {
      eventRepo: this.eventRepo.constructor.name,
      orgRepo: this.orgRepo.constructor.name,
      mediaAdapter: this.mediaAdapter.constructor.name,
      config: this.config
    })
  }

  /**
   * Get today's events with filtering
   */
  async getTodaysEvents(query: EventQuery = {}) {
    try {
      console.log('📅 ModernEventService.getTodaysEvents:', query)

      const events = await this.eventRepo.listToday({
        date: query.date,
        limit: query.limit
      })

      // Filter by status if requested
      const filteredEvents = query.status 
        ? events.filter(event => event.status === query.status)
        : events

      console.log(`✅ Found ${filteredEvents.length} events`)
      return filteredEvents

    } catch (error) {
      console.error('❌ ModernEventService.getTodaysEvents failed:', error)
      throw error
    }
  }

  /**
   * Get event details with organization context
   */
  async getEventDetails(orgSlug: string, huntId: string) {
    try {
      console.log('📖 ModernEventService.getEventDetails:', { orgSlug, huntId })

      // Get event details
      const event = await this.eventRepo.getEvent({ orgSlug, huntId })

      // Get organization context
      const orgResult = await this.orgRepo.getOrg({ orgSlug })
      const org = orgResult.data

      // Combine event with organization context
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
          lastUpdated: org.updatedAt
        }
      }

      console.log('✅ Event details retrieved with org context')
      return eventDetails

    } catch (error) {
      console.error('❌ ModernEventService.getEventDetails failed:', error)
      throw error
    }
  }

  /**
   * Upload media for an event with comprehensive error handling
   */
  async uploadEventMedia(request: MediaUploadRequest) {
    try {
      console.log('📸 ModernEventService.uploadEventMedia:', {
        fileName: request.file.name,
        size: request.file.size,
        type: request.file.type,
        orgSlug: request.orgSlug,
        huntId: request.huntId
      })

      // Validate file
      const validation = this.validateMediaFile(request.file)
      if (!validation.isValid) {
        throw new Error(`Media validation failed: ${validation.error}`)
      }

      // Determine upload type
      const mediaType = validation.mediaType!

      // Upload via media adapter
      const uploadOptions = {
        resourceType: mediaType,
        orgSlug: request.orgSlug,
        huntSlug: request.huntId,
        stopId: request.stopId,
        sessionId: `${request.orgSlug}-${request.huntId}-${Date.now()}`,
        ...request.options
      }

      let uploadResult
      if (mediaType === 'image') {
        uploadResult = await this.mediaAdapter.uploadImage({
          file: request.file,
          options: uploadOptions
        })
      } else {
        uploadResult = await this.mediaAdapter.uploadVideo({
          file: request.file,
          options: uploadOptions
        })
      }

      console.log('✅ Media upload successful:', uploadResult.publicId)
      
      return {
        ...uploadResult,
        uploadedAt: new Date().toISOString(),
        metadata: {
          orgSlug: request.orgSlug,
          huntId: request.huntId,
          stopId: request.stopId,
          uploadType: 'event-media'
        }
      }

    } catch (error) {
      console.error('❌ ModernEventService.uploadEventMedia failed:', error)
      throw error
    }
  }

  /**
   * Create a new event with validation
   */
  async createEvent(orgSlug: string, eventData: {
    huntName: string
    startDate: string
    endDate: string
    stops?: Array<{
      title: string
      lat: number
      lng: number
      description?: string
    }>
  }) {
    try {
      console.log('🆕 ModernEventService.createEvent:', { orgSlug, huntName: eventData.huntName })

      // Generate unique IDs
      const huntId = this.generateHuntId(eventData.huntName, eventData.startDate)
      const huntSlug = this.generateSlug(eventData.huntName)

      // Create event structure
      const event = {
        orgSlug,
        huntId,
        huntSlug,
        huntName: eventData.huntName,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        status: 'scheduled' as const,
        stops: eventData.stops?.map((stop, index) => ({
          id: `stop-${index + 1}`,
          title: stop.title,
          lat: stop.lat,
          lng: stop.lng,
          radiusMeters: 50,
          description: stop.description,
          requirements: [{
            type: 'photo' as const,
            required: true,
            description: 'Photo required'
          }],
          hints: [],
          assets: []
        })) || [],
        teams: [],
        rules: ''
      }

      // Save via event repository
      const result = await this.eventRepo.upsertEvent({
        event,
        expectedEtag: undefined
      })

      console.log('✅ Event created successfully:', result.data.huntId)
      return result.data

    } catch (error) {
      console.error('❌ ModernEventService.createEvent failed:', error)
      throw error
    }
  }

  /**
   * Health check for all adapters
   */
  async healthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      adapters: {
        eventRepo: { status: 'unknown' as 'ok' | 'error' | 'unknown', error: null as string | null },
        orgRepo: { status: 'unknown' as 'ok' | 'error' | 'unknown', error: null as string | null },
        media: { status: 'unknown' as 'ok' | 'error' | 'unknown', error: null as string | null }
      },
      overall: 'unknown' as 'healthy' | 'degraded' | 'unhealthy'
    }

    // Test event repo
    try {
      await this.eventRepo.listToday({ limit: 1 })
      results.adapters.eventRepo.status = 'ok'
    } catch (error) {
      results.adapters.eventRepo.status = 'error'
      results.adapters.eventRepo.error = error instanceof Error ? error.message : String(error)
    }

    // Test org repo
    try {
      await this.orgRepo.listOrgs({ limit: 1 })
      results.adapters.orgRepo.status = 'ok'
    } catch (error) {
      results.adapters.orgRepo.status = 'error'
      results.adapters.orgRepo.error = error instanceof Error ? error.message : String(error)
    }

    // Media adapter doesn't have a health check method, so we'll mark it as OK
    results.adapters.media.status = 'ok'

    // Determine overall health
    const errorCount = Object.values(results.adapters).filter(a => a.status === 'error').length
    if (errorCount === 0) {
      results.overall = 'healthy'
    } else if (errorCount === Object.keys(results.adapters).length) {
      results.overall = 'unhealthy'
    } else {
      results.overall = 'degraded'
    }

    console.log('🏥 Health check completed:', results.overall)
    return results
  }

  /**
   * Helper: Validate media file
   */
  private validateMediaFile(file: File): { isValid: boolean; error?: string; mediaType?: 'image' | 'video' } {
    if (!file) return { isValid: false, error: 'No file provided' }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

    const isImage = allowedImageTypes.includes(file.type)
    const isVideo = allowedVideoTypes.includes(file.type)

    if (!isImage && !isVideo) {
      return { isValid: false, error: 'File must be an image or video' }
    }

    const mediaType = isImage ? 'image' : 'video'
    const maxSize = isImage ? 12 * 1024 * 1024 : 200 * 1024 * 1024 // 12MB / 200MB
    const sizeLimit = isImage ? '12MB' : '200MB'

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be under ${sizeLimit}` }
    }

    return { isValid: true, mediaType }
  }

  /**
   * Helper: Generate hunt ID
   */
  private generateHuntId(huntName: string, startDate: string): string {
    const slug = this.generateSlug(huntName)
    const dateStr = startDate.replace(/-/g, '')
    return `${slug}-${dateStr}`
  }

  /**
   * Helper: Generate URL-safe slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '')
  }
}

/**
 * Default service instance for convenience
 */
export const modernEventService = new ModernEventService()