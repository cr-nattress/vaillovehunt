/**
 * Adapter Integration Tests
 * 
 * Comprehensive tests for adapter implementations including schema validation,
 * dependency injection, and real-world usage scenarios.
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { BlobOrgRepoAdapter, BlobEventRepoAdapter } from '../storage/blob.adapter'
import { CloudinaryMediaAdapter } from '../media/cloudinary.adapter'
import { AdapterRegistry, resetAdapters, setAdapterConfig } from '../registry'
import type { AppData } from '../../types/appData.schemas'
import type { OrgData } from '../../types/orgData.schemas'

// Mock the dependencies
vi.mock('../../services/BlobService', () => ({
  blobService: {
    readJson: vi.fn(),
    writeJson: vi.fn()
  }
}))

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn()
    },
    utils: {
      api_sign_request: vi.fn()
    }
  }
}))

describe('Adapter Integration Tests', () => {
  beforeAll(() => {
    // Initialize schema system for validation tests
    const { initializeSchemaSystem } = require('../../schemas/index')
    initializeSchemaSystem()
  })

  beforeEach(() => {
    // Reset registry before each test
    resetAdapters()
    vi.clearAllMocks()
  })

  describe('BlobOrgRepoAdapter', () => {
    let adapter: BlobOrgRepoAdapter

    beforeEach(() => {
      adapter = new BlobOrgRepoAdapter()
    })

    it('should create adapter with default configuration', () => {
      expect(adapter).toBeInstanceOf(BlobOrgRepoAdapter)
    })

    it('should handle getApp with schema validation', async () => {
      const { blobService } = await import('../../services/BlobService')
      const mockAppData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: { name: 'Test App', environment: 'test' },
          features: { 
            enableKVEvents: false, 
            enableBlobEvents: true, 
            enablePhotoUpload: true, 
            enableMapPage: false,
            enableVideoUpload: true,
            enableAdvancedValidation: false
          },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: []
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: mockAppData,
        etag: 'test-etag'
      })

      const result = await adapter.getApp()

      expect(result.data).toBeDefined()
      expect(result.data.schemaVersion).toBe('1.2.0')
      expect(result.etag).toBe('test-etag')
    })

    it('should handle getApp with migration from legacy format', async () => {
      const { blobService } = await import('../../services/BlobService')
      const legacyAppData = {
        schemaVersion: '0.9.0',
        appName: 'Legacy App',
        environment: 'production',
        useKVStore: false,
        useBlobStore: true,
        orgs: [{
          slug: 'test-org',
          name: 'Test Organization',
          contactEmail: 'test@example.com'
        }]
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: legacyAppData,
        etag: 'legacy-etag'
      })

      vi.mocked(blobService.writeJson).mockResolvedValue({
        etag: 'migrated-etag'
      })

      const result = await adapter.getApp()

      expect(result.data.schemaVersion).toBe('1.2.0')
      expect(result.data.app.metadata.name).toBe('Legacy App')
      expect(result.data.organizations).toHaveLength(1)
      expect(blobService.writeJson).toHaveBeenCalled() // Auto-migration save
    })

    it('should handle upsertOrg with validation', async () => {
      const { blobService } = await import('../../services/BlobService')
      const validOrgData: OrgData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [{
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }],
          settings: {
            defaultTeams: ['RED', 'GREEN', 'BLUE'],
            timezone: 'America/Denver'
          }
        },
        hunts: []
      }

      vi.mocked(blobService.writeJson).mockResolvedValue({
        etag: 'new-etag'
      })

      const result = await adapter.upsertOrg({
        orgSlug: 'test-org',
        orgData: validOrgData
      })

      expect(result).toBe('new-etag')
      expect(blobService.writeJson).toHaveBeenCalledWith(
        'orgs/test-org.json',
        expect.objectContaining({
          schemaVersion: '1.2.0',
          org: expect.objectContaining({
            orgSlug: 'test-org'
          })
        }),
        undefined
      )
    })

    it('should reject invalid org data', async () => {
      const invalidOrgData = {
        schemaVersion: '1.2.0',
        org: {
          orgSlug: 'test-org',
          // Missing required fields
        },
        hunts: []
      }

      await expect(adapter.upsertOrg({
        orgSlug: 'test-org',
        orgData: invalidOrgData as any
      })).rejects.toThrow('Org data validation failed')
    })
  })

  describe('BlobEventRepoAdapter', () => {
    let adapter: BlobEventRepoAdapter

    beforeEach(() => {
      adapter = new BlobEventRepoAdapter()
    })

    it('should create adapter with default configuration', () => {
      expect(adapter).toBeInstanceOf(BlobEventRepoAdapter)
    })

    it('should handle listToday with no events', async () => {
      const { blobService } = await import('../../services/BlobService')
      const mockAppData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: { name: 'Test App', environment: 'test' },
          features: { enableKVEvents: false, enableBlobEvents: true, enablePhotoUpload: true, enableMapPage: false, enableVideoUpload: true, enableAdvancedValidation: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: []
        // No byDate index
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: mockAppData,
        etag: 'test-etag'
      })

      const result = await adapter.listToday({ date: '2025-08-08' })

      expect(result).toEqual([])
    })

    it('should handle getEvent successfully', async () => {
      const { blobService } = await import('../../services/BlobService')
      const mockOrgData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
          settings: { defaultTeams: ['RED', 'GREEN'] }
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
          stops: []
        }]
      }

      vi.mocked(blobService.readJson).mockResolvedValue({
        data: mockOrgData,
        etag: 'test-etag'
      })

      const result = await adapter.getEvent({
        orgSlug: 'test-org',
        huntId: 'test-hunt'
      })

      expect(result.huntId).toBe('test-hunt')
      expect(result.huntName).toBe('Test Hunt')
      expect(result.orgSlug).toBe('test-org')
      expect(result.status).toBe('active')
    })
  })

  describe('CloudinaryMediaAdapter', () => {
    let adapter: CloudinaryMediaAdapter

    beforeEach(() => {
      adapter = new CloudinaryMediaAdapter({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        uploadFolder: 'test-uploads'
      })
    })

    it('should create adapter with configuration', () => {
      expect(adapter).toBeInstanceOf(CloudinaryMediaAdapter)
    })

    it('should handle successful image upload', async () => {
      const cloudinary = await import('cloudinary')
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const mockUploadStream = {
        end: vi.fn()
      }

      // Mock the upload stream with successful result
      vi.mocked(cloudinary.v2.uploader.upload_stream).mockImplementation((options, callback) => {
        setTimeout(() => {
          callback!(null, {
            public_id: 'test-uploads/session/test_123456789',
            secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test-image.jpg',
            width: 1200,
            height: 800,
            eager: [
              { secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/c_fill,h_300,w_300/test-image.jpg' }
            ]
          })
        }, 0)
        return mockUploadStream
      })

      const result = await adapter.uploadImage({
        file: mockFile,
        options: {
          resourceType: 'image',
          sessionId: 'test-session',
          locationTitle: 'Test Location'
        }
      })

      expect(result.mediaType).toBe('image')
      expect(result.publicId).toBe('test-uploads/session/test_123456789')
      expect(result.url).toContain('test-image.jpg')
      expect(result.thumbnailUrl).toBeDefined()
      expect(mockUploadStream.end).toHaveBeenCalled()
    })

    it('should handle video upload with poster generation', async () => {
      const cloudinary = await import('cloudinary')
      const mockFile = new File(['test-video'], 'test.mp4', { type: 'video/mp4' })
      
      const mockUploadStream = {
        end: vi.fn()
      }

      vi.mocked(cloudinary.v2.uploader.upload_stream).mockImplementation((options, callback) => {
        setTimeout(() => {
          callback!(null, {
            public_id: 'test-uploads/session/test_123456789',
            secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/test-video.mp4',
            width: 1920,
            height: 1080,
            duration: 30.5,
            eager: [
              { secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/so_0/test-video.jpg' }, // Poster
              { secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/c_fill,h_300,w_300/test-video.jpg' } // Thumbnail
            ]
          })
        }, 0)
        return mockUploadStream
      })

      const result = await adapter.uploadVideo({
        file: mockFile,
        options: {
          resourceType: 'video',
          sessionId: 'test-session',
          locationTitle: 'Test Location'
        }
      })

      expect(result.mediaType).toBe('video')
      expect(result.duration).toBe(30.5)
      expect(result.posterUrl).toBeDefined()
      expect(result.thumbnailUrl).toBeDefined()
    })

    it('should handle upload errors gracefully', async () => {
      const cloudinary = await import('cloudinary')
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      vi.mocked(cloudinary.v2.uploader.upload_stream).mockImplementation((options, callback) => {
        setTimeout(() => {
          callback!(new Error('Upload failed'), null)
        }, 0)
        return { end: vi.fn() }
      })

      await expect(adapter.uploadImage({
        file: mockFile,
        options: { resourceType: 'image' }
      })).rejects.toThrow('Upload failed')
    })
  })

  describe('AdapterRegistry', () => {
    it('should provide singleton instance', () => {
      const registry1 = AdapterRegistry.getInstance()
      const registry2 = AdapterRegistry.getInstance()
      expect(registry1).toBe(registry2)
    })

    it('should create adapters based on configuration', () => {
      setAdapterConfig({
        storageProvider: 'blob',
        mediaProvider: 'cloudinary',
        eventProvider: 'blob'
      })

      const registry = AdapterRegistry.getInstance()
      
      const orgRepo = registry.getOrgRepo()
      const eventRepo = registry.getEventRepo()
      const media = registry.getMedia()

      expect(orgRepo).toBeInstanceOf(BlobOrgRepoAdapter)
      expect(eventRepo).toBeInstanceOf(BlobEventRepoAdapter)
      expect(media).toBeInstanceOf(CloudinaryMediaAdapter)
    })

    it('should cache adapter instances', () => {
      const registry = AdapterRegistry.getInstance()
      
      const orgRepo1 = registry.getOrgRepo()
      const orgRepo2 = registry.getOrgRepo()
      
      expect(orgRepo1).toBe(orgRepo2) // Same instance
    })

    it('should reset instances when configuration changes', () => {
      const registry = AdapterRegistry.getInstance()
      
      const orgRepo1 = registry.getOrgRepo()
      
      setAdapterConfig({ storageProvider: 'mock' })
      
      const orgRepo2 = registry.getOrgRepo()
      
      expect(orgRepo1).not.toBe(orgRepo2) // Different instances
    })

    it('should handle mock adapters for testing', () => {
      setAdapterConfig({
        storageProvider: 'mock',
        mediaProvider: 'mock',
        eventProvider: 'mock'
      })

      const registry = AdapterRegistry.getInstance()
      
      const orgRepo = registry.getOrgRepo()
      const eventRepo = registry.getEventRepo()
      const media = registry.getMedia()

      // Mock adapters should not throw on basic operations
      expect(async () => {
        await orgRepo.listOrgs()
        await eventRepo.listToday({})
        await media.uploadImage({
          file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
          options: { resourceType: 'image' }
        })
      }).not.toThrow()
    })
  })
})