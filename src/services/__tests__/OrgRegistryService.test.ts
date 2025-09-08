/**
 * Tests for OrgRegistryService with mocked BlobService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrgRegistryService } from '../OrgRegistryService'
import type { AppData, OrganizationSummary } from '../../types/appData.schemas'
import type { OrgData, Hunt } from '../../types/orgData.schemas'

// Mock the BlobService
vi.mock('../BlobService', () => ({
  blobService: {
    readJson: vi.fn(),
    writeJson: vi.fn(),
  }
}))

import { blobService } from '../BlobService'

describe('OrgRegistryService', () => {
  let orgRegistryService: OrgRegistryService

  beforeEach(() => {
    orgRegistryService = OrgRegistryService.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = OrgRegistryService.getInstance()
      const instance2 = OrgRegistryService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(OrgRegistryService)
    })
  })

  describe('static utility methods', () => {
    it('should generate correct org key', () => {
      expect(OrgRegistryService.getOrgKey('test-org')).toBe('orgs/test-org.json')
      expect(OrgRegistryService.getOrgKey('bhhs')).toBe('orgs/bhhs.json')
    })

    it('should generate hunt slug from name', () => {
      expect(OrgRegistryService.generateHuntSlug('Summer Hunt 2025')).toBe('summer-hunt-2025')
      expect(OrgRegistryService.generateHuntSlug('Find the Goat!')).toBe('find-the-goat')
    })

    it('should generate hunt ID from name and date', () => {
      expect(OrgRegistryService.generateHuntId('Summer Hunt', '2025-08-08')).toBe('summer-hunt-20250808')
      expect(OrgRegistryService.generateHuntId('Vail Love Hunt', '2024-12-31')).toBe('vail-love-hunt-20241231')
    })
  })

  describe('loadApp', () => {
    it('should load and validate existing app data', async () => {
      const mockAppData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: {
            name: 'Test Hunt App',
            environment: 'development'
          },
          features: {
            enableKVEvents: false,
            enableBlobEvents: true,
            enablePhotoUpload: true,
            enableMapPage: false
          },
          defaults: {
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        organizations: [
          {
            orgSlug: 'test-org',
            orgName: 'Test Organization',
            contactEmail: 'test@example.com',
            status: 'active'
          }
        ]
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: mockAppData,
        etag: 'mock-etag-123'
      })

      const result = await orgRegistryService.loadApp()

      expect(blobService.readJson).toHaveBeenCalledWith('app.json')
      expect(result.data).toEqual(mockAppData)
      expect(result.etag).toBe('mock-etag-123')
    })

    it('should return default app structure when app.json not found', async () => {
      vi.mocked(blobService.readJson).mockRejectedValue(new Error('Key not found'))

      const result = await orgRegistryService.loadApp()

      expect(result.data.schemaVersion).toBe('1.0.0')
      expect(result.data.app.metadata.name).toBe('Vail Hunt')
      expect(result.data.app.metadata.environment).toBe('development')
      expect(result.data.organizations).toEqual([])
      expect(result.etag).toBeUndefined()
    })

    it('should handle invalid app data gracefully', async () => {
      const invalidData = { invalid: 'structure' }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: invalidData,
        etag: 'invalid-etag'
      })

      const result = await orgRegistryService.loadApp()

      // Should return default structure when validation fails
      expect(result.data.schemaVersion).toBe('1.0.0')
      expect(result.data.organizations).toEqual([])
    })
  })

  describe('loadOrg', () => {
    it('should load and validate organization data', async () => {
      const mockOrgData: OrgData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@test.com'
            }
          ],
          settings: {
            defaultTeams: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        hunts: []
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: mockOrgData,
        etag: 'org-etag-456'
      })

      const result = await orgRegistryService.loadOrg('test-org')

      expect(blobService.readJson).toHaveBeenCalledWith('orgs/test-org.json')
      expect(result.data).toEqual(mockOrgData)
      expect(result.etag).toBe('org-etag-456')
    })

    it('should throw error when org not found', async () => {
      vi.mocked(blobService.readJson).mockRejectedValue(new Error('Organization not found'))

      await expect(orgRegistryService.loadOrg('non-existent')).rejects.toThrow('Organization not found')
    })
  })

  describe('upsertApp', () => {
    it('should update app data with new timestamp', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T10:00:00Z',
        app: {
          metadata: {
            name: 'Updated App',
            environment: 'production'
          },
          features: {
            enableKVEvents: false,
            enableBlobEvents: true,
            enablePhotoUpload: true,
            enableMapPage: true
          },
          defaults: {
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        organizations: []
      }

      vi.mocked(blobService.writeJson).mockResolvedValue({
        success: true,
        etag: 'new-app-etag'
      })

      const result = await orgRegistryService.upsertApp(appData, 'existing-etag')

      expect(blobService.writeJson).toHaveBeenCalledWith(
        'app.json',
        expect.objectContaining({
          ...appData,
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        }),
        'existing-etag'
      )
      expect(result).toBe('new-app-etag')
    })

    it('should validate data before saving', async () => {
      const invalidAppData = {
        invalid: 'structure'
      } as any

      await expect(orgRegistryService.upsertApp(invalidAppData)).rejects.toThrow()
      expect(blobService.writeJson).not.toHaveBeenCalled()
    })
  })

  describe('upsertOrg', () => {
    it('should update org data with new timestamp', async () => {
      const orgData: OrgData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T10:00:00Z',
        org: {
          orgSlug: 'test-org',
          orgName: 'Updated Organization',
          contacts: [
            {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@test.com'
            }
          ],
          settings: {
            defaultTeams: ['RED', 'GREEN'],
            timezone: 'America/New_York',
            locale: 'en-US'
          }
        },
        hunts: []
      }

      vi.mocked(blobService.writeJson).mockResolvedValue({
        success: true,
        etag: 'new-org-etag'
      })

      const result = await orgRegistryService.upsertOrg(orgData, 'test-org', 'org-etag')

      expect(blobService.writeJson).toHaveBeenCalledWith(
        'orgs/test-org.json',
        expect.objectContaining({
          ...orgData,
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        }),
        'org-etag'
      )
      expect(result).toBe('new-org-etag')
    })
  })

  describe('organization management', () => {
    it('should add new organization to app data', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: []
      }

      const newOrg: OrganizationSummary = {
        orgSlug: 'new-org',
        orgName: 'New Organization',
        contactEmail: 'contact@new.com',
        status: 'active'
      }

      const result = await orgRegistryService.addOrganization(appData, newOrg)

      expect(result.organizations).toHaveLength(1)
      expect(result.organizations[0]).toEqual(newOrg)
    })

    it('should update existing organization in app data', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: [
          {
            orgSlug: 'existing-org',
            orgName: 'Old Name',
            contactEmail: 'old@example.com',
            status: 'inactive'
          }
        ]
      }

      const updatedOrg: OrganizationSummary = {
        orgSlug: 'existing-org',
        orgName: 'Updated Name',
        contactEmail: 'new@example.com',
        status: 'active'
      }

      const result = await orgRegistryService.addOrganization(appData, updatedOrg)

      expect(result.organizations).toHaveLength(1)
      expect(result.organizations[0]).toEqual(updatedOrg)
    })
  })

  describe('hunt management', () => {
    it('should add new hunt to organization', async () => {
      const orgData: OrgData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Org',
          contacts: [{ firstName: 'Test', lastName: 'User', email: 'test@example.com' }],
          settings: { defaultTeams: ['RED'], timezone: 'America/Denver', locale: 'en-US' }
        },
        hunts: []
      }

      const newHunt: Hunt = {
        id: 'new-hunt-20250808',
        slug: 'new-hunt',
        name: 'New Hunt',
        startDate: '2025-08-08',
        endDate: '2025-08-08',
        status: 'scheduled',
        access: { visibility: 'public', pinRequired: false },
        teams: [],
        stops: [],
        scoring: { basePerStop: 10, bonusCreative: 5 },
        moderation: { required: false, reviewers: [] },
        audit: {
          createdBy: 'admin@test.com',
          createdAt: '2025-08-08T12:00:00Z'
        }
      }

      const result = await orgRegistryService.addHuntToOrg(orgData, newHunt)

      expect(result.hunts).toHaveLength(1)
      expect(result.hunts[0]).toEqual(newHunt)
    })

    it('should update existing hunt in organization', async () => {
      const existingHunt: Hunt = {
        id: 'existing-hunt',
        slug: 'existing',
        name: 'Old Hunt Name',
        startDate: '2025-08-08',
        endDate: '2025-08-08',
        status: 'scheduled',
        access: { visibility: 'public', pinRequired: false },
        teams: [],
        stops: [],
        scoring: { basePerStop: 10, bonusCreative: 5 },
        moderation: { required: false, reviewers: [] },
        audit: { createdBy: 'admin@test.com', createdAt: '2025-08-08T10:00:00Z' }
      }

      const orgData: OrgData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Org',
          contacts: [{ firstName: 'Test', lastName: 'User', email: 'test@example.com' }],
          settings: { defaultTeams: ['RED'], timezone: 'America/Denver', locale: 'en-US' }
        },
        hunts: [existingHunt]
      }

      const updatedHunt: Hunt = {
        ...existingHunt,
        name: 'Updated Hunt Name',
        status: 'active'
      }

      const result = await orgRegistryService.addHuntToOrg(orgData, updatedHunt)

      expect(result.hunts).toHaveLength(1)
      expect(result.hunts[0].name).toBe('Updated Hunt Name')
      expect(result.hunts[0].status).toBe('active')
    })
  })

  describe('date index management', () => {
    it('should create new date index entry', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: []
      }

      const result = await orgRegistryService.updateByDateIndex(
        appData,
        '2025-08-08',
        'test-org',
        'summer-hunt-20250808'
      )

      expect(result.byDate).toBeDefined()
      expect(result.byDate!['2025-08-08']).toHaveLength(1)
      expect(result.byDate!['2025-08-08'][0]).toEqual({
        orgSlug: 'test-org',
        huntId: 'summer-hunt-20250808'
      })
    })

    it('should add to existing date index', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: [],
        byDate: {
          '2025-08-08': [
            { orgSlug: 'existing-org', huntId: 'existing-hunt' }
          ]
        }
      }

      const result = await orgRegistryService.updateByDateIndex(
        appData,
        '2025-08-08',
        'new-org',
        'new-hunt-20250808'
      )

      expect(result.byDate!['2025-08-08']).toHaveLength(2)
      expect(result.byDate!['2025-08-08'][1]).toEqual({
        orgSlug: 'new-org',
        huntId: 'new-hunt-20250808'
      })
    })

    it('should update existing date index entry', async () => {
      const appData: AppData = {
        schemaVersion: '1.0.0',
        updatedAt: '2025-08-08T12:00:00Z',
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: [],
        byDate: {
          '2025-08-08': [
            { orgSlug: 'test-org', huntId: 'old-hunt' }
          ]
        }
      }

      const result = await orgRegistryService.updateByDateIndex(
        appData,
        '2025-08-08',
        'test-org',
        'updated-hunt-20250808'
      )

      expect(result.byDate!['2025-08-08']).toHaveLength(1)
      expect(result.byDate!['2025-08-08'][0]).toEqual({
        orgSlug: 'test-org',
        huntId: 'updated-hunt-20250808'
      })
    })
  })

  describe('factory methods', () => {
    it('should create new org with proper defaults', () => {
      const contacts = [
        { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' }
      ]

      const result = orgRegistryService.createNewOrg('test-org', 'Test Organization', contacts)

      expect(result.schemaVersion).toBe('1.0.0')
      expect(result.org.orgSlug).toBe('test-org')
      expect(result.org.orgName).toBe('Test Organization')
      expect(result.org.contacts).toEqual(contacts)
      expect(result.org.settings.defaultTeams).toEqual(['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE'])
      expect(result.hunts).toEqual([])
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should create new hunt with proper ID generation', () => {
      const result = orgRegistryService.createNewHunt(
        'Summer Adventure 2025',
        '2025-08-15',
        '2025-08-15',
        'creator@test.com'
      )

      expect(result.id).toBe('summer-adventure-2025-20250815')
      expect(result.slug).toBe('summer-adventure-2025')
      expect(result.name).toBe('Summer Adventure 2025')
      expect(result.startDate).toBe('2025-08-15')
      expect(result.endDate).toBe('2025-08-15')
      expect(result.status).toBe('scheduled')
      expect(result.access.visibility).toBe('public')
      expect(result.access.pinRequired).toBe(false)
      expect(result.scoring.basePerStop).toBe(10)
      expect(result.scoring.bonusCreative).toBe(5)
      expect(result.moderation.required).toBe(false)
      expect(result.teams).toEqual([])
      expect(result.stops).toEqual([])
      expect(result.audit.createdBy).toBe('creator@test.com')
      expect(result.audit.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })
})