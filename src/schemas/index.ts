/**
 * Schema System Entry Point
 * 
 * Central registry for schema validation, migration, and version management.
 * Auto-initializes the complete schema system on import.
 */

// Migration system
export * from './migrations/index'
export * from './migrations/appData.migrations'
export * from './migrations/orgData.migrations'

// Versioned schemas
export * from './versions/index'
export * from './versions/appData.versions'
export * from './versions/orgData.versions'

// Validation system
export * from './validation/index'

// Re-export current schemas from types
export * from '../types/appData.schemas'
export * from '../types/orgData.schemas'

// Auto-initialization
import { registerAppDataMigrations } from './migrations/appData.migrations'
import { registerOrgDataMigrations } from './migrations/orgData.migrations'
import { registerAppDataVersions } from './versions/appData.versions'
import { registerOrgDataVersions } from './versions/orgData.versions'

/**
 * Initialize the complete schema system
 */
export function initializeSchemaSystem() {
  console.log('🔧 Initializing schema system...')
  
  try {
    // Register all migrations
    registerAppDataMigrations()
    registerOrgDataMigrations()
    
    // Register all schema versions
    registerAppDataVersions()
    registerOrgDataVersions()
    
    console.log('✅ Schema system initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Schema system initialization failed:', error)
    return false
  }
}

/**
 * Auto-initialize on module load
 */
let isInitialized = false

if (!isInitialized) {
  isInitialized = initializeSchemaSystem()
}

/**
 * Schema system status
 */
export function getSchemaSystemStatus() {
  return {
    initialized: isInitialized,
    dataTypes: ['appData', 'orgData'],
    features: [
      'Schema Validation',
      'Version Management', 
      'Data Migration',
      'Error Reporting',
      'Health Scoring'
    ]
  }
}

/**
 * Current schema versions (latest)
 */
export const CURRENT_SCHEMA_VERSIONS = {
  appData: '1.2.0',
  orgData: '1.2.0'
} as const