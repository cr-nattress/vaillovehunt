/**
 * Schema Migration Framework
 * 
 * Handles schema evolution and data migration for App and Org JSON structures.
 * Provides safe migration paths when schema versions change.
 */

import { z } from 'zod'

/**
 * Migration function type - transforms data from one version to another
 */
export type MigrationFn<TFrom = any, TTo = any> = (data: TFrom) => TTo

/**
 * Migration definition with metadata
 */
export interface Migration<TFrom = any, TTo = any> {
  from: string
  to: string
  description: string
  migrate: MigrationFn<TFrom, TTo>
  validate?: z.ZodSchema<TTo>
}

/**
 * Migration registry for organizing migrations by data type
 */
export interface MigrationRegistry {
  [dataType: string]: Migration[]
}

/**
 * Migration result with success/error information
 */
export interface MigrationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  migrationsApplied?: string[]
  finalVersion?: string
}

/**
 * Main migration engine
 */
export class MigrationEngine {
  private registry: MigrationRegistry = {}

  /**
   * Register a migration for a specific data type
   */
  registerMigration<TFrom, TTo>(
    dataType: string, 
    migration: Migration<TFrom, TTo>
  ): void {
    if (!this.registry[dataType]) {
      this.registry[dataType] = []
    }
    this.registry[dataType].push(migration)
  }

  /**
   * Get all migrations for a data type, sorted by version
   */
  getMigrations(dataType: string): Migration[] {
    return this.registry[dataType] || []
  }

  /**
   * Find migration path from source to target version
   */
  private findMigrationPath(
    dataType: string,
    fromVersion: string,
    toVersion: string
  ): Migration[] | null {
    const migrations = this.getMigrations(dataType)
    const path: Migration[] = []
    let currentVersion = fromVersion

    // Simple linear path finding - could be enhanced for complex version graphs
    while (currentVersion !== toVersion) {
      const nextMigration = migrations.find(m => m.from === currentVersion)
      
      if (!nextMigration) {
        console.warn(`No migration found from version ${currentVersion} for ${dataType}`)
        return null
      }

      path.push(nextMigration)
      currentVersion = nextMigration.to

      // Prevent infinite loops
      if (path.length > 20) {
        console.error(`Migration path too long for ${dataType}: ${fromVersion} -> ${toVersion}`)
        return null
      }
    }

    return path
  }

  /**
   * Migrate data from one version to another
   */
  migrate<T = any>(
    dataType: string,
    data: any,
    currentVersion: string,
    targetVersion: string
  ): MigrationResult<T> {
    // Already at target version
    if (currentVersion === targetVersion) {
      return {
        success: true,
        data,
        finalVersion: currentVersion,
        migrationsApplied: []
      }
    }

    // Find migration path
    const migrationPath = this.findMigrationPath(dataType, currentVersion, targetVersion)
    
    if (!migrationPath) {
      return {
        success: false,
        error: `No migration path found from ${currentVersion} to ${targetVersion} for ${dataType}`
      }
    }

    // Apply migrations sequentially
    let currentData = data
    const appliedMigrations: string[] = []

    try {
      for (const migration of migrationPath) {
        console.log(`🔄 Applying migration ${migration.from} -> ${migration.to}: ${migration.description}`)
        console.log(`📊 Pre-migration data sample:`, {
          keys: Object.keys(currentData || {}),
          schemaVersion: currentData?.schemaVersion,
          dataType: typeof currentData
        })
        
        const preMigrationData = currentData
        currentData = migration.migrate(currentData)
        appliedMigrations.push(`${migration.from}->${migration.to}`)

        console.log(`📊 Post-migration data sample:`, {
          keys: Object.keys(currentData || {}),
          schemaVersion: currentData?.schemaVersion,
          dataType: typeof currentData
        })

        // Validate result if schema provided
        if (migration.validate) {
          console.log(`🔍 Validating migration result with schema...`)
          const validationResult = migration.validate.safeParse(currentData)
          if (!validationResult.success) {
            console.error(`❌ Migration validation failed for ${migration.from} -> ${migration.to}:`)
            console.error(`🔍 Validation errors:`, validationResult.error.issues)
            console.error(`📋 Failed data structure:`, JSON.stringify(currentData, null, 2))
            console.error(`📋 Original data structure:`, JSON.stringify(preMigrationData, null, 2))
            throw new Error(`Migration validation failed: ${validationResult.error.message}`)
          }
          currentData = validationResult.data
          console.log(`✅ Migration validation passed for ${migration.from} -> ${migration.to}`)
        }
        
        console.log(`✅ Successfully applied migration ${migration.from} -> ${migration.to}`)
      }

      return {
        success: true,
        data: currentData,
        finalVersion: targetVersion,
        migrationsApplied: appliedMigrations
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        migrationsApplied: appliedMigrations
      }
    }
  }

  /**
   * Check if migration is needed
   */
  needsMigration(dataType: string, currentVersion: string, targetVersion: string): boolean {
    if (currentVersion === targetVersion) return false
    return this.findMigrationPath(dataType, currentVersion, targetVersion) !== null
  }

  /**
   * Get available versions for a data type
   */
  getAvailableVersions(dataType: string): string[] {
    const migrations = this.getMigrations(dataType)
    const versions = new Set<string>()
    
    migrations.forEach(m => {
      versions.add(m.from)
      versions.add(m.to)
    })

    return Array.from(versions).sort()
  }

  /**
   * Validate that migrations form a valid chain
   */
  validateMigrationChain(dataType: string): boolean {
    const migrations = this.getMigrations(dataType)
    const froms = new Set(migrations.map(m => m.from))
    const tos = new Set(migrations.map(m => m.to))

    // Each 'to' version (except the latest) should have a corresponding 'from' version
    for (const migration of migrations) {
      const hasNext = migrations.some(m => m.from === migration.to)
      const isLatest = !hasNext

      if (!isLatest && !froms.has(migration.to)) {
        console.error(`Broken migration chain: ${migration.to} has no follow-up migration`)
        return false
      }
    }

    return true
  }
}

/**
 * Global migration engine instance
 */
export const migrationEngine = new MigrationEngine()

/**
 * Utility function for applying migrations with error handling
 */
export async function migrateData<T = any>(
  dataType: string,
  data: any,
  currentVersion: string,
  targetVersion: string
): Promise<MigrationResult<T>> {
  try {
    return migrationEngine.migrate<T>(dataType, data, currentVersion, targetVersion)
  } catch (error) {
    return {
      success: false,
      error: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Validation helper to catch common migration issues
 */
export function validateMigrationOutput(
  migrationName: string,
  output: any,
  expectedFields: string[] = []
): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check for null values in optional string fields (common source of validation errors)
  function checkForNullInOptionalStrings(obj: any, path: string = '') {
    if (obj === null || obj === undefined) return

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        // Flag fields that are likely optional strings but contain null
        if (value === null && (
          key.includes('At') || // timestamps like lastUploadedAt
          key.includes('Url') || // URLs
          key.includes('Path') || // paths
          key.includes('Code') || // codes
          key.includes('Email') || // emails
          key.endsWith('Id') || // IDs
          key.endsWith('Name') // names
        )) {
          issues.push(`⚠️  ${currentPath} is null but should be undefined for optional string fields`)
        }
        
        if (typeof value === 'object') {
          checkForNullInOptionalStrings(value, currentPath)
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForNullInOptionalStrings(item, `${path}[${index}]`)
      })
    }
  }

  // Perform validation checks
  if (!output) {
    issues.push(`Migration ${migrationName} returned null/undefined output`)
  } else {
    checkForNullInOptionalStrings(output)
    
    // Check for expected fields
    for (const field of expectedFields) {
      if (!(field in output)) {
        issues.push(`Missing expected field: ${field}`)
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Enhanced migration wrapper with validation
 */
export function createSafeMigration<TFrom = any, TTo = any>(
  migration: Migration<TFrom, TTo>,
  expectedFields: string[] = []
): Migration<TFrom, TTo> {
  return {
    ...migration,
    migrate: (data: TFrom): TTo => {
      console.log(`🔄 Starting migration: ${migration.from} -> ${migration.to}`)
      
      const result = migration.migrate(data)
      
      // Validate the result
      const validation = validateMigrationOutput(
        `${migration.from}->${migration.to}`,
        result,
        expectedFields
      )
      
      if (!validation.valid) {
        console.warn(`⚠️  Migration ${migration.from} -> ${migration.to} has validation warnings:`)
        validation.issues.forEach(issue => console.warn(`   ${issue}`))
      } else {
        console.log(`✅ Migration ${migration.from} -> ${migration.to} passed validation checks`)
      }
      
      return result
    }
  }
}