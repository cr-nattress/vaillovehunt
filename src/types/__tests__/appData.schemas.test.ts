/**
 * Tests for App JSON data schemas
 */

import { describe, it, expect } from 'vitest'
import { 
  AppDataSchema,
  OrganizationSummarySchema,
  HuntIndexEntrySchema,
  DateIndexSchema 
} from '../appData.schemas'

describe('AppData Schemas', () => {
  describe('OrganizationSummarySchema', () => {
    it('should validate a valid organization summary', () => {
      const validOrg = {
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        contactEmail: 'test@example.com',
        status: 'active' as const
      }

      const result = OrganizationSummarySchema.parse(validOrg)
      expect(result).toEqual(validOrg)
    })

    it('should require orgSlug to be URL-safe', () => {
      const invalidOrg = {
        orgSlug: 'Test Org!', // Contains spaces and special chars
        orgName: 'Test Organization',
        contactEmail: 'test@example.com',
        status: 'active' as const
      }

      expect(() => OrganizationSummarySchema.parse(invalidOrg)).toThrow()
    })

    it('should validate email format', () => {
      const invalidOrg = {
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        contactEmail: 'not-an-email',
        status: 'active' as const
      }

      expect(() => OrganizationSummarySchema.parse(invalidOrg)).toThrow()
    })

    it('should default status to active', () => {
      const orgWithoutStatus = {
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        contactEmail: 'test@example.com'
      }

      const result = OrganizationSummarySchema.parse(orgWithoutStatus)
      expect(result.status).toBe('active')
    })
  })

  describe('HuntIndexEntrySchema', () => {
    it('should validate a valid hunt index entry', () => {
      const validEntry = {
        orgSlug: 'test-org',
        huntId: 'summer-hunt-20250808'
      }

      const result = HuntIndexEntrySchema.parse(validEntry)
      expect(result).toEqual(validEntry)
    })

    it('should require both orgSlug and huntId', () => {
      expect(() => HuntIndexEntrySchema.parse({ orgSlug: 'test-org' })).toThrow()
      expect(() => HuntIndexEntrySchema.parse({ huntId: 'test-hunt' })).toThrow()
    })
  })

  describe('DateIndexSchema', () => {
    it('should validate date index with valid dates', () => {
      const validIndex = {
        '2025-08-08': [
          { orgSlug: 'org1', huntId: 'hunt1' },
          { orgSlug: 'org2', huntId: 'hunt2' }
        ],
        '2025-08-09': [
          { orgSlug: 'org3', huntId: 'hunt3' }
        ]
      }

      const result = DateIndexSchema.parse(validIndex)
      expect(result).toEqual(validIndex)
    })

    it('should validate empty index', () => {
      const result = DateIndexSchema.parse({})
      expect(result).toEqual({})
    })

    it('should validate date format YYYY-MM-DD', () => {
      const invalidIndex = {
        '08/08/2025': [{ orgSlug: 'org1', huntId: 'hunt1' }] // Wrong format
      }

      expect(() => DateIndexSchema.parse(invalidIndex)).toThrow()
    })
  })

  describe('AppDataSchema', () => {
    it('should validate complete app data structure', () => {
      const validApp = {
        schemaVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Test App',
            environment: 'development' as const
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
            status: 'active' as const
          }
        ],
        byDate: {
          '2025-08-08': [
            { orgSlug: 'test-org', huntId: 'summer-hunt-20250808' }
          ]
        }
      }

      const result = AppDataSchema.parse(validApp)
      expect(result.schemaVersion).toBe('1.0.0')
      expect(result.organizations).toHaveLength(1)
      expect(result.byDate).toBeDefined()
    })

    it('should apply default values correctly', () => {
      const minimalApp = {
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Test App'
          },
          features: {},
          defaults: {}
        },
        organizations: []
      }

      const result = AppDataSchema.parse(minimalApp)
      
      // Schema version default
      expect(result.schemaVersion).toBe('1.0.0')
      
      // Environment default
      expect(result.app.metadata.environment).toBe('development')
      
      // Feature flag defaults
      expect(result.app.features.enableKVEvents).toBe(false)
      expect(result.app.features.enableBlobEvents).toBe(false)
      expect(result.app.features.enablePhotoUpload).toBe(true)
      expect(result.app.features.enableMapPage).toBe(false)
      
      // Default locale and timezone
      expect(result.app.defaults.timezone).toBe('America/Denver')
      expect(result.app.defaults.locale).toBe('en-US')
    })

    it('should make byDate optional', () => {
      const appWithoutByDate = {
        schemaVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Test App',
            environment: 'development' as const
          },
          features: {
            enableKVEvents: false,
            enableBlobEvents: false,
            enablePhotoUpload: true,
            enableMapPage: false
          },
          defaults: {
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        organizations: []
      }

      const result = AppDataSchema.parse(appWithoutByDate)
      expect(result.byDate).toBeUndefined()
    })
  })
})