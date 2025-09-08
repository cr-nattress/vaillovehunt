/**
 * Versioned Schema Definitions
 * 
 * Maintains backward compatibility by providing access to historical schema versions.
 * This allows validation of older data formats during migration processes.
 */

import { z } from 'zod'

/**
 * Schema version registry
 */
export interface SchemaVersion<T = any> {
  version: string
  schema: z.ZodSchema<T>
  description?: string
  deprecated?: boolean
  migrationTarget?: string
}

/**
 * Versioned schema registry for organizing schemas by data type and version
 */
export interface VersionedSchemaRegistry {
  [dataType: string]: {
    [version: string]: SchemaVersion
  }
}

/**
 * Schema version manager
 */
export class SchemaVersionManager {
  private registry: VersionedSchemaRegistry = {}

  /**
   * Register a schema version
   */
  registerVersion<T>(
    dataType: string,
    version: SchemaVersion<T>
  ): void {
    if (!this.registry[dataType]) {
      this.registry[dataType] = {}
    }
    this.registry[dataType][version.version] = version
  }

  /**
   * Get a specific schema version
   */
  getSchema<T = any>(dataType: string, version: string): z.ZodSchema<T> | null {
    return this.registry[dataType]?.[version]?.schema || null
  }

  /**
   * Get all versions for a data type
   */
  getVersions(dataType: string): string[] {
    return Object.keys(this.registry[dataType] || {}).sort()
  }

  /**
   * Get the latest version for a data type
   */
  getLatestVersion(dataType: string): string | null {
    const versions = this.getVersions(dataType)
    return versions[versions.length - 1] || null
  }

  /**
   * Check if a version is deprecated
   */
  isDeprecated(dataType: string, version: string): boolean {
    return this.registry[dataType]?.[version]?.deprecated || false
  }

  /**
   * Get migration target for a deprecated version
   */
  getMigrationTarget(dataType: string, version: string): string | null {
    return this.registry[dataType]?.[version]?.migrationTarget || null
  }

  /**
   * Validate data against a specific schema version
   */
  validate<T = any>(
    dataType: string,
    version: string,
    data: any
  ): { success: boolean; data?: T; error?: string } {
    const schema = this.getSchema<T>(dataType, version)
    
    if (!schema) {
      return {
        success: false,
        error: `Schema version ${version} not found for ${dataType}`
      }
    }

    try {
      const result = schema.parse(data)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Auto-detect data version from schema version field
   */
  detectVersion(data: any): string | null {
    return data?.schemaVersion || null
  }

  /**
   * Validate and potentially migrate data to latest version
   */
  validateWithMigration<T = any>(
    dataType: string,
    data: any,
    targetVersion?: string
  ): {
    success: boolean
    data?: T
    error?: string
    version?: string
    migrationApplied?: boolean
  } {
    const detectedVersion = this.detectVersion(data)
    const target = targetVersion || this.getLatestVersion(dataType)
    
    if (!detectedVersion || !target) {
      return {
        success: false,
        error: `Cannot determine version for ${dataType} validation`
      }
    }

    // If already at target version, just validate
    if (detectedVersion === target) {
      const result = this.validate<T>(dataType, target, data)
      return {
        ...result,
        version: target,
        migrationApplied: false
      }
    }

    // TODO: Integration with migration system would go here
    return {
      success: false,
      error: 'Migration integration not yet implemented in this version'
    }
  }
}

/**
 * Global schema version manager
 */
export const schemaVersions = new SchemaVersionManager()