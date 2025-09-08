/**
 * App Data Schema Versions
 * 
 * Historical schema definitions for App JSON data structure validation.
 */

import { z } from 'zod'
import { schemaVersions } from './index'
import { AppDataSchema } from '../../types/appData.schemas'

/**
 * App Data Schema v0.9.0 (Legacy)
 * Original flat structure before nested organization
 */
const AppDataSchema_0_9_0 = z.object({
  schemaVersion: z.string().default('0.9.0'),
  appName: z.string(),
  environment: z.string().optional(),
  version: z.string().optional(),
  etag: z.string().optional(),
  
  // Legacy feature flags (flat structure)
  useKVStore: z.boolean().optional(),
  useBlobStore: z.boolean().optional(),
  photoUploads: z.boolean().default(true),
  showMap: z.boolean().default(false),
  
  // Legacy configuration
  defaultTimezone: z.string().default('America/Denver'),
  defaultLocale: z.string().default('en-US'),
  
  // Legacy map config
  mapConfig: z.object({
    provider: z.string().optional(),
    tileUrl: z.string().optional(),
    attribution: z.string().optional()
  }).optional(),
  
  // Legacy email config
  emailConfig: z.object({
    from: z.string().email().optional(),
    enabled: z.boolean().default(false)
  }).optional(),
  
  // Legacy organization list (simpler structure)
  orgs: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    contactEmail: z.string().email(),
    createdAt: z.string().optional(),
    huntCount: z.number().optional(),
    commonTeams: z.array(z.string()).optional()
  })).optional(),
  
  // Legacy date index
  dateIndex: z.record(z.string(), z.array(z.object({
    orgSlug: z.string(),
    huntId: z.string()
  }))).optional(),
  
  updatedAt: z.string().optional()
})

/**
 * App Data Schema v1.0.0
 * Current structured format with nested app configuration
 */
const AppDataSchema_1_0_0 = z.object({
  schemaVersion: z.string().default('1.0.0'),
  etag: z.string().optional(),
  updatedAt: z.string(),
  app: z.object({
    metadata: z.object({
      name: z.string(),
      environment: z.string(),
      uiVersion: z.string().optional(),
    }),
    features: z.object({
      enableKVEvents: z.boolean().default(false),
      enableBlobEvents: z.boolean().default(false),
      enablePhotoUpload: z.boolean().default(true),
      enableMapPage: z.boolean().default(false),
    }),
    defaults: z.object({
      timezone: z.string().default('America/Denver'),
      locale: z.string().default('en-US'),
    }),
    map: z.object({
      tileProvider: z.string().optional(),
      tileUrl: z.string().optional(),
      attribution: z.string().optional(),
    }).optional(),
    email: z.object({
      fromAddress: z.string().email().optional(),
      sendingEnabled: z.boolean().default(false),
    }).optional(),
  }),
  organizations: z.array(z.object({
    orgSlug: z.string(),
    orgName: z.string(),
    primaryContactEmail: z.string().email(),
    createdAt: z.string(),
    orgBlobKey: z.string(),
    summary: z.object({
      huntsTotal: z.number().default(0),
      teamsCommon: z.array(z.string()).default([]),
    }).optional(),
  })),
  byDate: z.record(z.string(), z.array(z.object({
    orgSlug: z.string(),
    huntId: z.string(),
  }))).optional(),
})

/**
 * App Data Schema v1.1.0
 * Adds privacy and limits configuration
 */
const AppDataSchema_1_1_0 = z.object({
  schemaVersion: z.string().default('1.1.0'),
  etag: z.string().optional(),
  updatedAt: z.string(),
  app: z.object({
    metadata: z.object({
      name: z.string(),
      environment: z.string(),
      uiVersion: z.string().optional(),
    }),
    features: z.object({
      enableKVEvents: z.boolean().default(false),
      enableBlobEvents: z.boolean().default(false),
      enablePhotoUpload: z.boolean().default(true),
      enableMapPage: z.boolean().default(false),
    }),
    defaults: z.object({
      timezone: z.string().default('America/Denver'),
      locale: z.string().default('en-US'),
    }),
    map: z.object({
      tileProvider: z.string().optional(),
      tileUrl: z.string().optional(),
      attribution: z.string().optional(),
    }).optional(),
    email: z.object({
      fromAddress: z.string().email().optional(),
      sendingEnabled: z.boolean().default(false),
    }).optional(),
    privacy: z.object({
      mediaRetentionDays: z.number().default(365),
      dataDeletionContact: z.string().email().optional(),
    }).optional(),
    limits: z.object({
      maxUploadSizeMB: z.number().default(10),
      maxPhotosPerTeam: z.number().default(100),
      allowedMediaTypes: z.array(z.string()).default(['image/jpeg', 'image/png']),
    }).optional(),
  }),
  organizations: z.array(z.object({
    orgSlug: z.string(),
    orgName: z.string(),
    primaryContactEmail: z.string().email(),
    createdAt: z.string(),
    orgBlobKey: z.string(),
    summary: z.object({
      huntsTotal: z.number().default(0),
      teamsCommon: z.array(z.string()).default([]),
    }).optional(),
  })),
  byDate: z.record(z.string(), z.array(z.object({
    orgSlug: z.string(),
    huntId: z.string(),
  }))).optional(),
})

/**
 * Register all App Data schema versions
 */
export function registerAppDataVersions() {
  // Legacy version (deprecated)
  schemaVersions.registerVersion('appData', {
    version: '0.9.0',
    schema: AppDataSchema_0_9_0,
    description: 'Legacy flat structure before nested organization',
    deprecated: true,
    migrationTarget: '1.0.0'
  })

  // Version 1.0.0 (stable)
  schemaVersions.registerVersion('appData', {
    version: '1.0.0',
    schema: AppDataSchema_1_0_0,
    description: 'Current structured format with nested app configuration'
  })

  // Version 1.1.0 (with privacy/limits)
  schemaVersions.registerVersion('appData', {
    version: '1.1.0',
    schema: AppDataSchema_1_1_0,
    description: 'Adds privacy and limits configuration sections'
  })

  // Version 1.2.0 (latest - uses current schema from types)
  schemaVersions.registerVersion('appData', {
    version: '1.2.0',
    schema: AppDataSchema,
    description: 'Latest version with video support and enhanced feature flags'
  })

  console.log('✅ App Data schema versions registered:', schemaVersions.getVersions('appData'))
}