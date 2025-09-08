/**
 * App Data Migration Definitions
 * 
 * Handles migration of global App JSON structure between schema versions.
 */

import { Migration, migrationEngine } from './index'
import { AppDataSchema } from '../../types/appData.schemas'

/**
 * Migration: 1.0.0 -> 1.1.0
 * Adds privacy and limits sections with defaults
 */
const migration_1_0_0_to_1_1_0: Migration = {
  from: '1.0.0',
  to: '1.1.0',
  description: 'Add privacy and limits configuration sections',
  migrate: (data: any) => {
    return {
      ...data,
      schemaVersion: '1.1.0',
      updatedAt: new Date().toISOString(),
      app: {
        ...data.app,
        privacy: {
          mediaRetentionDays: 365,
          dataDeletionContact: undefined
        },
        limits: {
          maxUploadSizeMB: 10,
          maxPhotosPerTeam: 100,
          allowedMediaTypes: ['image/jpeg', 'image/png', 'image/gif']
        }
      }
    }
  },
  validate: AppDataSchema
}

/**
 * Migration: 1.1.0 -> 1.2.0
 * Adds video support and enhances feature flags
 */
const migration_1_1_0_to_1_2_0: Migration = {
  from: '1.1.0',
  to: '1.2.0',
  description: 'Add video upload support and enhanced feature flags',
  migrate: (data: any) => {
    return {
      ...data,
      schemaVersion: '1.2.0',
      updatedAt: new Date().toISOString(),
      app: {
        ...data.app,
        features: {
          ...data.app.features,
          enableVideoUpload: true,
          enableAdvancedValidation: false
        },
        limits: {
          ...data.app.limits,
          maxUploadSizeMB: 200, // Increased for video support
          allowedMediaTypes: [
            ...data.app.limits.allowedMediaTypes,
            'video/mp4',
            'video/quicktime',
            'video/webm'
          ]
        }
      }
    }
  },
  validate: AppDataSchema
}

/**
 * Migration: 0.9.0 -> 1.0.0 (Legacy to current)
 * Transforms legacy format to current schema structure
 */
const migration_0_9_0_to_1_0_0: Migration = {
  from: '0.9.0',
  to: '1.0.0',
  description: 'Transform legacy app format to current schema structure',
  migrate: (data: any) => {
    // Handle legacy format that might not have nested structure
    const legacyData = data.metadata ? data : { metadata: data }
    
    return {
      schemaVersion: '1.0.0',
      etag: legacyData.etag || undefined,
      updatedAt: new Date().toISOString(),
      app: {
        metadata: {
          name: legacyData.metadata?.appName || legacyData.appName || 'Vail Hunt',
          environment: legacyData.metadata?.environment || 'production',
          uiVersion: legacyData.metadata?.version || undefined
        },
        features: {
          enableKVEvents: legacyData.features?.useKVStore || false,
          enableBlobEvents: legacyData.features?.useBlobStore || false,
          enablePhotoUpload: legacyData.features?.photoUploads !== false,
          enableMapPage: legacyData.features?.showMap || false
        },
        defaults: {
          timezone: legacyData.defaultTimezone || 'America/Denver',
          locale: legacyData.defaultLocale || 'en-US'
        },
        map: legacyData.mapConfig ? {
          tileProvider: legacyData.mapConfig.provider,
          tileUrl: legacyData.mapConfig.tileUrl,
          attribution: legacyData.mapConfig.attribution
        } : undefined,
        email: legacyData.emailConfig ? {
          fromAddress: legacyData.emailConfig.from,
          sendingEnabled: legacyData.emailConfig.enabled || false
        } : undefined
      },
      organizations: Array.isArray(legacyData.orgs) 
        ? legacyData.orgs.map((org: any) => ({
            orgSlug: org.slug || org.id,
            orgName: org.name,
            primaryContactEmail: org.contactEmail || org.contact?.email,
            createdAt: org.createdAt || new Date().toISOString(),
            orgBlobKey: `orgs/${org.slug || org.id}.json`,
            summary: {
              huntsTotal: org.huntCount || 0,
              teamsCommon: org.commonTeams || []
            }
          }))
        : [],
      byDate: legacyData.dateIndex || undefined
    }
  },
  validate: AppDataSchema
}

/**
 * Register all app data migrations
 */
export function registerAppDataMigrations() {
  migrationEngine.registerMigration('appData', migration_0_9_0_to_1_0_0)
  migrationEngine.registerMigration('appData', migration_1_0_0_to_1_1_0)
  migrationEngine.registerMigration('appData', migration_1_1_0_to_1_2_0)
  
  console.log('✅ App Data migrations registered:', migrationEngine.getAvailableVersions('appData'))
}

/**
 * Utility function to migrate app data to latest version
 */
export async function migrateAppDataToLatest(data: any, currentVersion?: string) {
  const detectedVersion = currentVersion || data.schemaVersion || '0.9.0'
  const targetVersion = '1.2.0' // Latest version
  
  return migrationEngine.migrate('appData', data, detectedVersion, targetVersion)
}