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
        console.log(`Applying migration ${migration.from} -> ${migration.to}: ${migration.description}`)
        
        currentData = migration.migrate(currentData)
        appliedMigrations.push(`${migration.from}->${migration.to}`)

        // Validate result if schema provided
        if (migration.validate) {
          const validationResult = migration.validate.safeParse(currentData)
          if (!validationResult.success) {
            throw new Error(`Migration validation failed: ${validationResult.error.message}`)
          }
          currentData = validationResult.data
        }
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