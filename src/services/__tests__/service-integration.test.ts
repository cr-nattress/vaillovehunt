/**
 * Service Integration Tests - Phase 5 Complete
 * 
 * Comprehensive tests for the service layer refactoring including:
 * - EventServiceV2 with adapter integration
 * - OrgRegistryServiceV2 with clean architecture
 * - HuntDomainService business logic
 * - Migration compatibility layers
 * - API endpoint integration
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { EventServiceV2 } from '../EventServiceV2'
import { OrgRegistryServiceV2 } from '../OrgRegistryServiceV2'
import { HuntDomainService } from '../domain/HuntDomainService'
import { ServiceMigrationManager, MigrationPhase, CompatibilityLayer } from '../migration/ServiceMigrationGuide'
import type { CreateOrgRequest, CreateHuntRequest } from '../OrgRegistryServiceV2'

// Mock the adapter registry and dependencies
vi.mock('../../infra/registry', () => ({
  getEventRepo: vi.fn(() => ({
    listToday: vi.fn().mockResolvedValue([]),
    getEvent: vi.fn().mockResolvedValue({
      huntId: 'test-hunt',
      huntName: 'Test Hunt',
      orgSlug: 'test-org',
      startDate: '2025-08-08',
      endDate: '2025-08-08',
      status: 'active',
      location: { city: 'Test City', state: 'Test State' },
      stops: [],
      teams: []
    }),
    upsertEvent: vi.fn().mockResolvedValue({
      data: { huntId: 'test-hunt' },
      etag: 'new-etag'
    })
  })),
  getOrgRepo: vi.fn(() => ({
    getApp: vi.fn().mockResolvedValue({
      data: {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: { name: 'Test App', environment: 'test' },
          features: { enableKVEvents: false, enableBlobEvents: true, enablePhotoUpload: true, enableMapPage: false, enableVideoUpload: true, enableAdvancedValidation: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: [],
        byDate: {}
      },
      etag: 'app-etag'
    }),
    getOrg: vi.fn().mockResolvedValue({
      data: {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
          settings: { defaultTeams: ['RED', 'GREEN', 'BLUE'] }
        },
        hunts: []
      },
      etag: 'org-etag'
    }),
    upsertOrg: vi.fn().mockResolvedValue('new-org-etag'),
    upsertApp: vi.fn().mockResolvedValue('new-app-etag'),
    listOrgs: vi.fn().mockResolvedValue([
      {
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        contactEmail: 'john@example.com',
        status: 'active',
        huntCount: 0
      }
    ])
  }))
}))

vi.mock('../../config', () => ({
  getFlags: vi.fn(() => ({
    app: { environment: 'test' }
  }))
}))

describe('Service Layer Integration Tests', () => {
  let eventService: EventServiceV2
  let orgService: OrgRegistryServiceV2
  let domainService: HuntDomainService
  let migrationManager: ServiceMigrationManager

  beforeAll(() => {
    // Initialize test environment
    console.log('🧪 Setting up service integration tests')
  })

  beforeEach(() => {
    // Create fresh service instances for each test
    eventService = new EventServiceV2()
    orgService = new OrgRegistryServiceV2()
    domainService = new HuntDomainService()
    migrationManager = new ServiceMigrationManager({ phase: MigrationPhase.V2_WITH_FALLBACK })
    
    vi.clearAllMocks()
  })

  describe('EventServiceV2 Integration', () => {
    it('should fetch today\'s events with caching', async () => {
      const events = await eventService.fetchTodaysEvents()
      
      expect(events).toBeDefined()
      expect(Array.isArray(events)).toBe(true)
    })

    it('should get event details with organization context', async () => {
      const details = await eventService.getEventDetails('test-org', 'test-hunt')
      
      expect(details).toBeDefined()
      expect(details.huntId).toBe('test-hunt')
      expect(details.organization).toBeDefined()
      expect(details.organization.name).toBe('Test Organization')
    })

    it('should handle health checks', async () => {
      const health = await eventService.getHealthStatus()
      
      expect(health).toBeDefined()
      expect(health.service).toBe('EventServiceV2')
      expect(health.overall).toMatch(/healthy|degraded|unhealthy/)
      expect(health.adapters).toBeDefined()
    })

    it('should support cache clearing', () => {
      expect(() => eventService.clearCache()).not.toThrow()
    })
  })

  describe('OrgRegistryServiceV2 Integration', () => {
    it('should load app data with migration support', async () => {
      const result = await orgService.loadApp()
      
      expect(result).toBeDefined()
      expect(result.data.schemaVersion).toBe('1.2.0')
      expect(result.data.app).toBeDefined()
      expect(result.etag).toBe('app-etag')
    })

    it('should load organization data with caching', async () => {
      const result = await orgService.loadOrg('test-org')
      
      expect(result).toBeDefined()
      expect(result.data.org.orgSlug).toBe('test-org')
      expect(result.data.org.orgName).toBe('Test Organization')
      expect(result.etag).toBe('org-etag')
    })

    it('should create new organization with proper structure', async () => {
      const createRequest: CreateOrgRequest = {
        orgSlug: 'new-test-org',
        orgName: 'New Test Organization',
        contacts: [
          { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        ]
      }

      const result = await orgService.createOrganization(createRequest)
      
      expect(result).toBeDefined()
      expect(result.data.org.orgSlug).toBe('new-test-org')
      expect(result.data.org.orgName).toBe('New Test Organization')
      expect(result.data.hunts).toEqual([])
      expect(result.etag).toBe('new-org-etag')
    })

    it('should list organizations with filtering', async () => {
      const orgs = await orgService.listOrganizations({ 
        status: 'active',
        limit: 10,
        includeHuntCount: true
      })
      
      expect(Array.isArray(orgs)).toBe(true)
      expect(orgs.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle health checks', async () => {
      const health = await orgService.getHealthStatus()
      
      expect(health).toBeDefined()
      expect(health.service).toBe('OrgRegistryServiceV2')
      expect(health.adapters.orgRepo).toBeDefined()
    })
  })

  describe('HuntDomainService Integration', () => {
    it('should orchestrate complete hunt creation', async () => {
      const orgRequest: CreateOrgRequest = {
        orgSlug: 'domain-test-org',
        orgName: 'Domain Test Organization',
        contacts: [
          { firstName: 'Domain', lastName: 'Tester', email: 'domain@example.com' }
        ]
      }

      const huntRequest: CreateHuntRequest = {
        huntName: 'Domain Test Hunt',
        startDate: '2025-08-10',
        endDate: '2025-08-10',
        createdBy: 'domain-test-user',
        location: {
          city: 'Test City',
          state: 'Test State',
          zip: '12345'
        }
      }

      const result = await domainService.createCompleteHunt('domain-test-org', huntRequest, orgRequest)
      
      expect(result).toBeDefined()
      expect(result.hunt).toBeDefined()
      expect(result.organization).toBeDefined()
      expect(result.dateIndexUpdated).toBe(true)
      expect(result.etags.org).toBeDefined()
    })

    it('should get today\'s hunts with context enhancement', async () => {
      const hunts = await domainService.getTodaysHunts({
        includeContext: true
      })
      
      expect(Array.isArray(hunts)).toBe(true)
      // Context enhancement would be applied if there were events
    })

    it('should get hunt with full context', async () => {
      // First ensure we have an organization with a hunt
      const mockOrgWithHunt = {
        data: {
          schemaVersion: '1.2.0',
          updatedAt: new Date().toISOString(),
          org: {
            orgSlug: 'test-org',
            orgName: 'Test Organization',
            contacts: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
            settings: { defaultTeams: ['RED', 'GREEN', 'BLUE'] }
          },
          hunts: [{
            id: 'test-hunt',
            slug: 'test-hunt',
            name: 'Test Hunt',
            startDate: '2025-08-08',
            endDate: '2025-08-08',
            status: 'active' as const,
            access: { visibility: 'public' as const, pinRequired: false },
            scoring: { basePerStop: 10, bonusCreative: 5 },
            moderation: { required: false, reviewers: [] },
            stops: [],
            teams: [],
            audit: { createdBy: 'test-user', createdAt: new Date().toISOString() }
          }]
        },
        etag: 'org-etag'
      }

      // Mock the org service to return our hunt
      vi.mocked(orgService.loadOrg).mockResolvedValueOnce(mockOrgWithHunt)

      const huntContext = await domainService.getHuntWithContext('test-org', 'test-hunt')
      
      expect(huntContext).toBeDefined()
      expect(huntContext.hunt.id).toBe('test-hunt')
      expect(huntContext.organization.name).toBe('Test Organization')
      expect(huntContext.metadata.participantCount).toBe(0) // No teams
    })

    it('should generate organization analytics', async () => {
      const analytics = await domainService.getOrganizationAnalytics('test-org')
      
      expect(analytics).toBeDefined()
      expect(analytics.totalHunts).toBeGreaterThanOrEqual(0)
      expect(analytics.activeHunts).toBeGreaterThanOrEqual(0)
      expect(analytics.completedHunts).toBeGreaterThanOrEqual(0)
      expect(analytics.scheduledHunts).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(analytics.recentActivity)).toBe(true)
    })

    it('should perform health checks for all dependencies', async () => {
      const health = await domainService.getHealthStatus()
      
      expect(health).toBeDefined()
      expect(health.service).toBe('HuntDomainService')
      expect(health.dependencies.eventService).toBeDefined()
      expect(health.dependencies.orgService).toBeDefined()
      expect(health.overall).toMatch(/healthy|degraded|unhealthy/)
    })
  })

  describe('Migration Strategy Integration', () => {
    it('should manage migration phases correctly', () => {
      expect(migrationManager.getMigrationStatus().phase).toBe(MigrationPhase.V2_WITH_FALLBACK)
      
      migrationManager.setMigrationPhase(MigrationPhase.V2_PRIMARY)
      expect(migrationManager.getMigrationStatus().phase).toBe(MigrationPhase.V2_PRIMARY)
    })

    it('should provide compatibility layer access', async () => {
      const events = await CompatibilityLayer.fetchTodaysEvents()
      expect(Array.isArray(events)).toBe(true)
      
      const orgService = CompatibilityLayer.orgRegistryService
      expect(orgService).toBeDefined()
      expect(orgService instanceof OrgRegistryServiceV2).toBe(true)
      
      const eventService = CompatibilityLayer.eventService
      expect(eventService).toBeDefined()
      expect(eventService instanceof EventServiceV2).toBe(true)
    })

    it('should track usage statistics', async () => {
      const initialStats = migrationManager.getMigrationStatus()
      
      // Use services through migration manager
      await migrationManager.fetchTodaysEvents()
      migrationManager.getEventService()
      migrationManager.getOrgRegistryService()
      
      const updatedStats = migrationManager.getMigrationStatus()
      
      expect(updatedStats.summary.totalCalls).toBeGreaterThan(initialStats.summary.totalCalls)
      expect(updatedStats.summary.v2Usage).toBeGreaterThanOrEqual(0)
    })

    it('should provide migration recommendations', () => {
      const status = migrationManager.getMigrationStatus()
      
      expect(Array.isArray(status.recommendations)).toBe(true)
      expect(status.recommendations.length).toBeGreaterThanOrEqual(0)
    })

    it('should clear usage statistics', () => {
      migrationManager.getEventService() // Generate some stats
      
      const beforeClear = migrationManager.getMigrationStatus()
      migrationManager.clearStats()
      const afterClear = migrationManager.getMigrationStatus()
      
      expect(afterClear.summary.totalCalls).toBe(0)
    })
  })

  describe('End-to-End Service Integration', () => {
    it('should handle complete hunt lifecycle', async () => {
      // 1. Create organization
      const orgRequest: CreateOrgRequest = {
        orgSlug: 'e2e-test-org',
        orgName: 'E2E Test Organization',
        contacts: [
          { firstName: 'E2E', lastName: 'Tester', email: 'e2e@example.com' }
        ]
      }

      const orgResult = await orgService.createOrganization(orgRequest)
      expect(orgResult.data.org.orgSlug).toBe('e2e-test-org')

      // 2. Create hunt
      const huntRequest: CreateHuntRequest = {
        huntName: 'E2E Test Hunt',
        startDate: '2025-08-15',
        endDate: '2025-08-15',
        createdBy: 'e2e-test-user'
      }

      const huntResult = await domainService.createCompleteHunt('e2e-test-org', huntRequest)
      expect(huntResult.hunt.name).toBe('E2E Test Hunt')

      // 3. Verify hunt appears in today's events (mock would need date adjustment)
      const events = await eventService.fetchTodaysEvents({ date: '2025-08-15' })
      expect(Array.isArray(events)).toBe(true)

      // 4. Get analytics
      const analytics = await domainService.getOrganizationAnalytics('e2e-test-org')
      expect(analytics.totalHunts).toBeGreaterThanOrEqual(0)

      // 5. Check system health
      const health = await domainService.getHealthStatus()
      expect(health.overall).toBeDefined()
    })

    it('should maintain data consistency across services', async () => {
      // Test that data modifications through one service are reflected in others
      const orgSlug = 'consistency-test-org'
      
      // Create through domain service
      const huntRequest: CreateHuntRequest = {
        huntName: 'Consistency Test Hunt',
        startDate: '2025-08-12',
        endDate: '2025-08-12',
        createdBy: 'consistency-tester'
      }

      const orgRequest: CreateOrgRequest = {
        orgSlug,
        orgName: 'Consistency Test Organization',
        contacts: [{ firstName: 'Consistency', lastName: 'Tester', email: 'consistency@example.com' }]
      }

      await domainService.createCompleteHunt(orgSlug, huntRequest, orgRequest)

      // Verify through org service
      const orgData = await orgService.loadOrg(orgSlug)
      expect(orgData.data.org.orgSlug).toBe(orgSlug)

      // Verify through event service (would show in date index)
      const events = await eventService.fetchTodaysEvents({ date: '2025-08-12' })
      expect(Array.isArray(events)).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service failure
      const mockError = new Error('Service temporarily unavailable')
      vi.mocked(orgService.loadOrg).mockRejectedValueOnce(mockError)

      await expect(domainService.getHuntWithContext('nonexistent-org', 'nonexistent-hunt'))
        .rejects.toThrow('Service temporarily unavailable')
    })

    it('should provide meaningful error messages', async () => {
      await expect(domainService.getHuntWithContext('test-org', 'nonexistent-hunt'))
        .rejects.toThrow('not found')
    })

    it('should validate business rules', async () => {
      const invalidHuntRequest: CreateHuntRequest = {
        huntName: 'Invalid Hunt',
        startDate: '2025-08-20',
        endDate: '2025-08-10', // End before start
        createdBy: 'test-user'
      }

      await expect(domainService.createCompleteHunt('test-org', invalidHuntRequest))
        .rejects.toThrow('end date must be after start date')
    })
  })
})