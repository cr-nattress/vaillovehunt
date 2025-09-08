/**
 * Schema Validation System Tests
 * 
 * Tests the comprehensive validation system with migration and error handling.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { validateAppData, validateOrgData, validator } from '../validation/index'
import { migrationEngine } from '../migrations/index'
import { schemaVersions } from '../versions/index'

describe('Schema Validation System', () => {
  beforeAll(async () => {
    // Ensure schema system is initialized
    const { initializeSchemaSystem } = await import('../index')
    initializeSchemaSystem()
  })

  describe('App Data Validation', () => {
    it('should validate valid current app data', async () => {
      const validAppData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Test App',
            environment: 'development'
          },
          features: {
            enableKVEvents: false,
            enableBlobEvents: true,
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

      const result = await validateAppData(validAppData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.version).toBe('1.2.0')
      expect(result.migrationApplied).toBe(false)
    })

    it('should apply migration from legacy format', async () => {
      const legacyAppData = {
        schemaVersion: '0.9.0',
        appName: 'Legacy App',
        environment: 'production',
        useKVStore: false,
        useBlobStore: true,
        orgs: [
          {
            slug: 'test-org',
            name: 'Test Organization',
            contactEmail: 'test@example.com',
            createdAt: new Date().toISOString()
          }
        ]
      }

      const result = await validateAppData(legacyAppData, { autoMigrate: true })
      
      console.log('Migration result:', JSON.stringify(result, null, 2))
      
      expect(result.success).toBe(true)
      expect(result.migrationApplied).toBe(true)
      expect(result.data?.schemaVersion).toBe('1.2.0')
      expect(result.data?.app?.metadata?.name).toBe('Legacy App')
      expect(result.data?.organizations).toHaveLength(1)
      expect(result.migrationDetails?.migrationsApplied).toBeDefined()
    })

    it('should generate warnings for missing optional config', async () => {
      const minimalAppData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: {
            name: 'Minimal App',
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

      const result = await validateAppData(minimalAppData, { includeWarnings: true })
      
      expect(result.success).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings?.some(w => w.code === 'MISSING_OPTIONAL_CONFIG')).toBe(true)
    })

    it('should fail validation for invalid data', async () => {
      const invalidAppData = {
        schemaVersion: '1.2.0',
        // Missing required fields
        app: {
          metadata: {
            // Missing name field
            environment: 'development'
          }
        }
      }

      const result = await validateAppData(invalidAppData, { strict: true })
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('Organization Data Validation', () => {
    it('should validate valid current org data', async () => {
      const validOrgData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'Admin'
            }
          ],
          settings: {
            defaultTeams: ['RED', 'GREEN', 'BLUE'],
            timezone: 'America/Denver'
          }
        },
        hunts: []
      }

      const result = await validateOrgData(validOrgData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.version).toBe('1.2.0')
      expect(result.migrationApplied).toBe(false)
    })

    it('should apply migration from legacy format', async () => {
      const legacyOrgData = {
        schemaVersion: '0.9.0',
        orgSlug: 'legacy-org',
        orgName: 'Legacy Organization',
        contact: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        defaultTeams: ['RED', 'BLUE'],
        hunts: [
          {
            id: 'legacy-hunt',
            name: 'Legacy Hunt',
            date: '2025-08-08',
            status: 'active',
            stops: []
          }
        ]
      }

      const result = await validateOrgData(legacyOrgData, { autoMigrate: true })
      
      expect(result.success).toBe(true)
      expect(result.migrationApplied).toBe(true)
      expect(result.data?.schemaVersion).toBe('1.2.0')
      expect(result.data?.org?.orgSlug).toBe('legacy-org')
      expect(result.data?.org?.contacts).toHaveLength(1)
      expect(result.data?.hunts).toHaveLength(1)
    })

    it('should fail validation for invalid email', async () => {
      const invalidOrgData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'not-an-email', // Invalid email
              role: 'Admin'
            }
          ],
          settings: {
            defaultTeams: ['RED', 'GREEN', 'BLUE']
          }
        },
        hunts: []
      }

      const result = await validateOrgData(invalidOrgData, { strict: true })
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.code === 'INVALID_STRING')).toBe(true)
    })
  })

  describe('Migration System', () => {
    it('should detect migration needs correctly', () => {
      const needsMigration = migrationEngine.needsMigration('appData', '0.9.0', '1.2.0')
      expect(needsMigration).toBe(true)

      const noMigrationNeeded = migrationEngine.needsMigration('appData', '1.2.0', '1.2.0')
      expect(noMigrationNeeded).toBe(false)
    })

    it('should provide available versions', () => {
      const appVersions = migrationEngine.getAvailableVersions('appData')
      expect(appVersions).toContain('0.9.0')
      expect(appVersions).toContain('1.0.0')
      expect(appVersions).toContain('1.2.0')

      const orgVersions = migrationEngine.getAvailableVersions('orgData')
      expect(orgVersions).toContain('0.9.0')
      expect(orgVersions).toContain('1.0.0')
      expect(orgVersions).toContain('1.2.0')
    })
  })

  describe('Schema Version Management', () => {
    it('should provide latest versions', () => {
      const latestAppVersion = schemaVersions.getLatestVersion('appData')
      expect(latestAppVersion).toBe('1.2.0')

      const latestOrgVersion = schemaVersions.getLatestVersion('orgData')
      expect(latestOrgVersion).toBe('1.2.0')
    })

    it('should detect deprecated versions', () => {
      const isDeprecated = schemaVersions.isDeprecated('appData', '0.9.0')
      expect(isDeprecated).toBe(true)

      const isNotDeprecated = schemaVersions.isDeprecated('appData', '1.2.0')
      expect(isNotDeprecated).toBe(false)
    })
  })

  describe('Health Reporting', () => {
    it('should provide health score for valid data', async () => {
      const validData = {
        schemaVersion: '1.2.0',
        updatedAt: new Date().toISOString(),
        app: {
          metadata: { name: 'Test App', environment: 'development' },
          features: { enableKVEvents: false, enableBlobEvents: true, enablePhotoUpload: true, enableMapPage: false, enableVideoUpload: true, enableAdvancedValidation: false },
          defaults: { timezone: 'America/Denver', locale: 'en-US' }
        },
        organizations: []
      }

      const result = await validator.validateWithHealthReport('appData', validData)
      
      expect(result.success).toBe(true)
      expect(result.healthScore).toBeGreaterThan(80)
    })

    it('should provide recommendations for data with warnings', async () => {
      const dataWithWarnings = {
        schemaVersion: '0.9.0', // Deprecated version
        appName: 'Old App',
        environment: 'production',
        orgs: []
      }

      const result = await validator.validateWithHealthReport('appData', dataWithWarnings, { autoMigrate: true })
      
      expect(result.success).toBe(true)
      expect(result.recommendations).toBeDefined()
      expect(result.recommendations?.some(r => r.includes('migrated'))).toBe(true)
    })
  })
})