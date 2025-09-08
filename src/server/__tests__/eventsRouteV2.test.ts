/**
 * Events Route V2 API Integration Tests
 * 
 * Tests for the new API endpoints that use the service layer architecture.
 * Covers REST endpoints, error handling, and data validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import eventsRouterV2 from '../eventsRouteV2'

// Mock the domain service
vi.mock('../../services/domain', () => ({
  huntDomainService: {
    getTodaysHunts: vi.fn().mockResolvedValue([
      {
        key: 'events/2025-08-08/test-org',
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        eventName: 'Test Hunt',
        startAt: '2025-08-08',
        endAt: '2025-08-08',
        data: {
          huntId: 'test-hunt',
          status: 'active',
          stops: 5,
          teams: ['RED', 'BLUE']
        }
      }
    ]),
    getHuntWithContext: vi.fn().mockResolvedValue({
      hunt: {
        id: 'test-hunt',
        name: 'Test Hunt',
        status: 'active',
        startDate: '2025-08-08',
        endDate: '2025-08-08'
      },
      organization: {
        slug: 'test-org',
        name: 'Test Organization',
        contacts: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
        settings: {}
      },
      metadata: {
        schemaVersion: '1.2.0',
        lastUpdated: new Date().toISOString(),
        participantCount: 2
      }
    }),
    createCompleteHunt: vi.fn().mockResolvedValue({
      hunt: {
        id: 'new-test-hunt',
        name: 'New Test Hunt',
        status: 'scheduled'
      },
      organization: {
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization'
        }
      },
      dateIndexUpdated: true,
      etags: { org: 'new-etag' }
    }),
    getOrganizationAnalytics: vi.fn().mockResolvedValue({
      totalHunts: 5,
      activeHunts: 2,
      completedHunts: 2,
      scheduledHunts: 1,
      totalStops: 25,
      totalTeams: 10,
      avgStopsPerHunt: 5,
      recentActivity: []
    }),
    getHealthStatus: vi.fn().mockResolvedValue({
      timestamp: new Date().toISOString(),
      service: 'HuntDomainService',
      dependencies: {
        eventService: { overall: 'healthy' },
        orgService: { overall: 'healthy' }
      },
      overall: 'healthy'
    }),
    clearCaches: vi.fn()
  }
}))

describe('Events Route V2 API Integration', () => {
  let app: express.Application

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use('/api/v2', eventsRouterV2)
    
    vi.clearAllMocks()
  })

  describe('GET /api/v2/events', () => {
    it('should return today\'s events successfully', async () => {
      const response = await request(app)
        .get('/api/v2/events')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          events: expect.arrayContaining([
            expect.objectContaining({
              key: 'events/2025-08-08/test-org',
              orgSlug: 'test-org',
              orgName: 'Test Organization',
              eventName: 'Test Hunt'
            })
          ]),
          count: 1
        }
      })
    })

    it('should support query parameters', async () => {
      const response = await request(app)
        .get('/api/v2/events?orgSlug=test-org&status=active&includeContext=true')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.filters).toMatchObject({
        orgSlug: 'test-org',
        status: 'active',
        includeContext: true
      })
    })

    it('should handle custom date parameter', async () => {
      const response = await request(app)
        .get('/api/v2/events?date=2025-08-10')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.date).toBe('2025-08-10')
    })

    it('should handle service errors gracefully', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getTodaysHunts).mockRejectedValueOnce(new Error('Service error'))

      const response = await request(app)
        .get('/api/v2/events')
        .expect(500)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch events',
        message: 'Service error'
      })
    })
  })

  describe('GET /api/v2/events/all', () => {
    it('should return all events across organizations', async () => {
      // Mock the private access to orgService for the all events endpoint
      const { huntDomainService } = await import('../../services/domain')
      const mockOrgService = {
        listOrganizations: vi.fn().mockResolvedValue([
          {
            orgSlug: 'test-org',
            orgName: 'Test Organization',
            status: 'active',
            huntCount: 1
          }
        ]),
        loadOrg: vi.fn().mockResolvedValue({
          data: {
            org: {
              orgSlug: 'test-org',
              orgName: 'Test Organization',
              contacts: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }]
            },
            hunts: [{
              id: 'test-hunt',
              name: 'Test Hunt',
              startDate: '2025-08-08',
              endDate: '2025-08-08',
              status: 'active',
              stops: [],
              teams: []
            }]
          }
        })
      }

      // Mock private member access
      Object.defineProperty(huntDomainService, 'orgService', {
        get: () => mockOrgService,
        configurable: true
      })

      const response = await request(app)
        .get('/api/v2/events/all')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.events).toBeDefined()
      expect(response.body.data.organizationCount).toBe(1)
    })

    it('should support filtering and limits', async () => {
      const response = await request(app)
        .get('/api/v2/events/all?status=active&limit=10&includeContext=true')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.filters).toMatchObject({
        status: 'active',
        limit: 10,
        includeContext: true
      })
    })
  })

  describe('GET /api/v2/events/:orgSlug/:huntId', () => {
    it('should return event details with context', async () => {
      const response = await request(app)
        .get('/api/v2/events/test-org/test-hunt')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          hunt: expect.objectContaining({
            id: 'test-hunt',
            name: 'Test Hunt'
          }),
          organization: expect.objectContaining({
            slug: 'test-org',
            name: 'Test Organization'
          }),
          metadata: expect.objectContaining({
            participantCount: 2
          })
        }
      })
    })

    it('should return 404 for non-existent events', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getHuntWithContext).mockRejectedValueOnce(
        new Error('Hunt not found')
      )

      const response = await request(app)
        .get('/api/v2/events/nonexistent/nonexistent')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Event not found'
      })
    })
  })

  describe('POST /api/v2/events', () => {
    it('should create a new hunt successfully', async () => {
      const createRequest = {
        orgSlug: 'test-org',
        huntRequest: {
          huntName: 'New Test Hunt',
          startDate: '2025-08-15',
          endDate: '2025-08-15',
          createdBy: 'api-test-user'
        }
      }

      const response = await request(app)
        .post('/api/v2/events')
        .send(createRequest)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Hunt created successfully',
        data: expect.objectContaining({
          hunt: expect.objectContaining({
            name: 'New Test Hunt'
          })
        })
      })
    })

    it('should validate required fields', async () => {
      const invalidRequest = {
        // Missing orgSlug and huntRequest
      }

      const response = await request(app)
        .post('/api/v2/events')
        .send(invalidRequest)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields'
      })
    })

    it('should handle business rule violations', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.createCompleteHunt).mockRejectedValueOnce(
        new Error('Organization has reached maximum hunt limit')
      )

      const createRequest = {
        orgSlug: 'test-org',
        huntRequest: {
          huntName: 'Limit Test Hunt',
          startDate: '2025-08-15',
          endDate: '2025-08-15',
          createdBy: 'api-test-user'
        }
      }

      const response = await request(app)
        .post('/api/v2/events')
        .send(createRequest)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Business rule violation'
      })
    })
  })

  describe('GET /api/v2/organizations/:orgSlug/analytics', () => {
    it('should return organization analytics', async () => {
      const response = await request(app)
        .get('/api/v2/organizations/test-org/analytics')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalHunts: 5,
          activeHunts: 2,
          avgStopsPerHunt: 5
        })
      })
    })

    it('should handle non-existent organizations', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getOrganizationAnalytics).mockRejectedValueOnce(
        new Error('Organization not found')
      )

      const response = await request(app)
        .get('/api/v2/organizations/nonexistent/analytics')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Organization not found'
      })
    })
  })

  describe('GET /api/v2/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v2/health')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          service: 'HuntDomainService',
          overall: 'healthy'
        })
      })
    })

    it('should return degraded status appropriately', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getHealthStatus).mockResolvedValueOnce({
        timestamp: new Date().toISOString(),
        service: 'HuntDomainService',
        dependencies: {
          eventService: { overall: 'healthy' },
          orgService: { overall: 'degraded' }
        },
        overall: 'degraded'
      })

      const response = await request(app)
        .get('/api/v2/health')
        .expect(200) // Still 200 for degraded

      expect(response.body.data.overall).toBe('degraded')
    })

    it('should return 503 for unhealthy status', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getHealthStatus).mockResolvedValueOnce({
        timestamp: new Date().toISOString(),
        service: 'HuntDomainService',
        dependencies: {
          eventService: { overall: 'unhealthy' },
          orgService: { overall: 'unhealthy' }
        },
        overall: 'unhealthy'
      })

      const response = await request(app)
        .get('/api/v2/health')
        .expect(503)

      expect(response.body.data.overall).toBe('unhealthy')
    })
  })

  describe('POST /api/v2/cache/clear', () => {
    it('should clear caches successfully', async () => {
      const response = await request(app)
        .post('/api/v2/cache/clear')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'All service caches cleared successfully',
        data: { cleared: true }
      })

      const { huntDomainService } = await import('../../services/domain')
      expect(huntDomainService.clearCaches).toHaveBeenCalled()
    })

    it('should handle cache clear errors', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.clearCaches).mockImplementationOnce(() => {
        throw new Error('Cache clear failed')
      })

      const response = await request(app)
        .post('/api/v2/cache/clear')
        .expect(500)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to clear caches'
      })
    })
  })

  describe('API Response Format', () => {
    it('should maintain consistent response structure', async () => {
      const response = await request(app)
        .get('/api/v2/events')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body.success).toBe(true)
    })

    it('should include timestamps in all responses', async () => {
      const response = await request(app)
        .get('/api/v2/events')
        .expect(200)

      expect(response.body.timestamp).toBeDefined()
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date)
    })

    it('should handle errors with consistent format', async () => {
      const { huntDomainService } = await import('../../services/domain')
      vi.mocked(huntDomainService.getTodaysHunts).mockRejectedValueOnce(new Error('Test error'))

      const response = await request(app)
        .get('/api/v2/events')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('timestamp')
    })
  })
})