/**
 * Migration utilities for App JSON data
 * Handles versioned schema migrations with type safety
 */

import { AppDataSchema, CURRENT_APP_SCHEMA_VERSION } from '../../types/appData.schemas'
import type { AppData } from '../../types/appData.schemas'

/**
 * Migrates App JSON data from any version to the current schema version
 * @param data Raw data from storage (unknown format)
 * @returns Validated and migrated AppData
 */
export function migrateAppJson(data: unknown): AppData {
  // TODO: Phase 3 - Implement version detection and migration chain
  
  // For now, attempt direct validation with current schema
  // This will be expanded in future phases with per-version migration steps
  try {
    const result = AppDataSchema.parse(data)
    return result
  } catch (error) {
    console.warn('App JSON migration failed, falling back to defaults:', error)
    
    // Return minimal valid structure
    return AppDataSchema.parse({
      schemaVersion: CURRENT_APP_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      app: {
        metadata: {
          name: 'Vail Love Hunt',
          environment: 'unknown'
        },
        features: {},
        defaults: {}
      },
      organizations: []
    })
  }
}

/**
 * Migration step: v1.0.0 -> v1.1.0 (placeholder)
 * TODO: Implement when we have schema version 1.1.0
 */
function migrateAppJson_v1_0_to_v1_1(data: any): any {
  // TODO: Add migration logic for specific version changes
  // Example: Add new required fields, transform data structures, etc.
  return data
}

/**
 * Migration step: v1.1.0 -> v1.2.0 (placeholder)
 * TODO: Implement when we have schema version 1.2.0
 */
function migrateAppJson_v1_1_to_v1_2(data: any): any {
  // TODO: Add migration logic for specific version changes
  return data
}

/**
 * Get default App JSON structure
 * Useful for initialization and fallback scenarios
 */
export function getDefaultAppJson(): AppData {
  return AppDataSchema.parse({
    schemaVersion: CURRENT_APP_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    app: {
      metadata: {
        name: 'Vail Love Hunt',
        environment: 'development'
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
  })
}