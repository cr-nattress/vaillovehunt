/**
 * Schema Validation Utilities
 * 
 * Comprehensive validation system with error handling, migration integration,
 * and developer-friendly error reporting for App/Org JSON structures.
 */

import { z } from 'zod'
import { migrationEngine, type MigrationResult } from '../migrations/index'
import { schemaVersions } from '../versions/index'

/**
 * Validation result with comprehensive error information
 */
export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  version?: string
  migrationApplied?: boolean
  migrationDetails?: MigrationResult
}

/**
 * Structured validation error
 */
export interface ValidationError {
  code: string
  message: string
  path?: string[]
  severity: 'error' | 'warning'
  suggestion?: string
}

/**
 * Validation warning for non-critical issues
 */
export interface ValidationWarning {
  code: string
  message: string
  path?: string[]
  suggestion?: string
}

/**
 * Validation options
 */
export interface ValidationOptions {
  strict?: boolean
  autoMigrate?: boolean
  targetVersion?: string
  includeWarnings?: boolean
  transformDeprecated?: boolean
}

/**
 * Main validation service
 */
export class ValidationService {
  /**
   * Validate data with comprehensive error handling and optional migration
   */
  async validate<T = any>(
    dataType: string,
    data: any,
    options: ValidationOptions = {}
  ): Promise<ValidationResult<T>> {
    const {
      strict = false,
      autoMigrate = true,
      targetVersion,
      includeWarnings = true,
      transformDeprecated = true
    } = options

    try {
      // Detect current version
      const currentVersion = this.detectVersion(data)
      const latestVersion = targetVersion || schemaVersions.getLatestVersion(dataType)

      if (!currentVersion && strict) {
        return {
          success: false,
          errors: [{
            code: 'MISSING_SCHEMA_VERSION',
            message: 'Schema version not found in data',
            severity: 'error',
            suggestion: 'Add schemaVersion field to your data'
          }]
        }
      }

      // Use fallback version if not detected
      const workingVersion = currentVersion || this.getDefaultVersion(dataType)
      const target = latestVersion || workingVersion

      if (!workingVersion || !target) {
        return {
          success: false,
          errors: [{
            code: 'NO_SCHEMA_AVAILABLE',
            message: `No schema available for ${dataType}`,
            severity: 'error',
            suggestion: 'Register schema versions for this data type'
          }]
        }
      }

      let validationData = data
      let migrationResult: MigrationResult | undefined
      let migrationApplied = false

      // Apply migration if needed and enabled
      if (autoMigrate && workingVersion !== target) {
        if (migrationEngine.needsMigration(dataType, workingVersion, target)) {
          migrationResult = await migrationEngine.migrate(dataType, data, workingVersion, target)
          
          if (migrationResult.success) {
            validationData = migrationResult.data
            migrationApplied = true
          } else if (strict) {
            return {
              success: false,
              errors: [{
                code: 'MIGRATION_FAILED',
                message: `Migration failed: ${migrationResult.error}`,
                severity: 'error',
                suggestion: 'Check data format and migration definitions'
              }],
              migrationDetails: migrationResult
            }
          }
        }
      }

      // Validate against target schema
      const schema = schemaVersions.getSchema(dataType, target)
      if (!schema) {
        return {
          success: false,
          errors: [{
            code: 'SCHEMA_NOT_FOUND',
            message: `Schema version ${target} not found for ${dataType}`,
            severity: 'error'
          }]
        }
      }

      const result = schema.safeParse(validationData)
      
      if (!result.success) {
        const errors = this.formatZodErrors(result.error)
        return {
          success: false,
          errors,
          version: target,
          migrationApplied,
          migrationDetails: migrationResult
        }
      }

      // Generate warnings if requested
      const warnings: ValidationWarning[] = []
      if (includeWarnings) {
        warnings.push(...this.generateWarnings(dataType, result.data, workingVersion, target))
      }

      return {
        success: true,
        data: result.data,
        version: target,
        migrationApplied,
        migrationDetails: migrationResult,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: `Validation failed with exception: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      }
    }
  }

  /**
   * Quick validation without migration - for performance-critical paths
   */
  validateOnly<T = any>(
    dataType: string,
    data: any,
    version?: string
  ): ValidationResult<T> {
    try {
      const targetVersion = version || this.detectVersion(data) || this.getDefaultVersion(dataType)
      
      if (!targetVersion) {
        return {
          success: false,
          errors: [{
            code: 'NO_VERSION_SPECIFIED',
            message: 'No schema version specified or detected',
            severity: 'error'
          }]
        }
      }

      const schema = schemaVersions.getSchema<T>(dataType, targetVersion)
      if (!schema) {
        return {
          success: false,
          errors: [{
            code: 'SCHEMA_NOT_FOUND',
            message: `Schema version ${targetVersion} not found`,
            severity: 'error'
          }]
        }
      }

      const result = schema.safeParse(data)
      
      if (!result.success) {
        return {
          success: false,
          errors: this.formatZodErrors(result.error),
          version: targetVersion
        }
      }

      return {
        success: true,
        data: result.data,
        version: targetVersion
      }

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      }
    }
  }

  /**
   * Detect schema version from data
   */
  private detectVersion(data: any): string | null {
    return data?.schemaVersion || null
  }

  /**
   * Get default version for a data type (usually latest)
   */
  private getDefaultVersion(dataType: string): string | null {
    return schemaVersions.getLatestVersion(dataType)
  }

  /**
   * Format Zod validation errors into structured format
   */
  private formatZodErrors(error: z.ZodError): ValidationError[] {
    return error.issues.map(issue => ({
      code: issue.code.toUpperCase(),
      message: issue.message,
      path: issue.path.length > 0 ? issue.path.map(String) : undefined,
      severity: 'error' as const,
      suggestion: this.getSuggestionForZodIssue(issue)
    }))
  }

  /**
   * Generate contextual suggestions for Zod validation issues
   */
  private getSuggestionForZodIssue(issue: z.ZodIssue): string | undefined {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        return `Expected ${issue.expected}, received ${issue.received}. Check data type at path: ${issue.path.join('.')}`
      
      case z.ZodIssueCode.too_small:
        return issue.type === 'string' 
          ? `String must be at least ${issue.minimum} characters long`
          : `Value must be at least ${issue.minimum}`
      
      case z.ZodIssueCode.too_big:
        return issue.type === 'string'
          ? `String must be at most ${issue.maximum} characters long`
          : `Value must be at most ${issue.maximum}`
      
      case z.ZodIssueCode.invalid_string:
        return issue.validation === 'email' 
          ? 'Provide a valid email address'
          : `String format validation failed: ${issue.validation}`
      
      case z.ZodIssueCode.invalid_enum_value:
        return `Must be one of: ${issue.options.join(', ')}`
      
      default:
        return undefined
    }
  }

  /**
   * Generate warnings for data quality issues
   */
  private generateWarnings(
    dataType: string,
    data: any,
    originalVersion?: string,
    currentVersion?: string
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    // Warn about deprecated versions
    if (originalVersion && schemaVersions.isDeprecated(dataType, originalVersion)) {
      const target = schemaVersions.getMigrationTarget(dataType, originalVersion)
      warnings.push({
        code: 'DEPRECATED_VERSION',
        message: `Schema version ${originalVersion} is deprecated`,
        suggestion: target ? `Consider migrating to version ${target}` : 'Upgrade to a newer version'
      })
    }

    // Warn about missing optional but recommended fields
    if (dataType === 'appData') {
      if (!data.app?.map) {
        warnings.push({
          code: 'MISSING_OPTIONAL_CONFIG',
          message: 'Map configuration not provided',
          path: ['app', 'map'],
          suggestion: 'Consider adding map configuration for location features'
        })
      }
      
      if (!data.app?.privacy) {
        warnings.push({
          code: 'MISSING_PRIVACY_CONFIG',
          message: 'Privacy configuration not provided',
          path: ['app', 'privacy'],
          suggestion: 'Consider adding privacy settings for compliance'
        })
      }
    }

    return warnings
  }

  /**
   * Validate and report comprehensive data health
   */
  async validateWithHealthReport<T = any>(
    dataType: string,
    data: any,
    options: ValidationOptions = {}
  ): Promise<ValidationResult<T> & { healthScore?: number; recommendations?: string[] }> {
    const result = await this.validate<T>(dataType, data, { ...options, includeWarnings: true })
    
    if (!result.success) {
      return result
    }

    // Calculate health score (0-100)
    const errorCount = result.errors?.length || 0
    const warningCount = result.warnings?.length || 0
    const healthScore = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5))

    // Generate recommendations
    const recommendations: string[] = []
    
    if (result.migrationApplied) {
      recommendations.push('Data was migrated - consider updating source to use latest schema version')
    }
    
    if (warningCount > 0) {
      recommendations.push('Address validation warnings to improve data quality')
    }
    
    if (healthScore < 80) {
      recommendations.push('Multiple data quality issues detected - review validation errors and warnings')
    }

    return {
      ...result,
      healthScore,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    }
  }
}

/**
 * Global validation service instance
 */
export const validator = new ValidationService()

/**
 * Convenience functions for common validation tasks
 */
export async function validateAppData(data: any, options?: ValidationOptions) {
  return validator.validate('appData', data, options)
}

export async function validateOrgData(data: any, options?: ValidationOptions) {
  return validator.validate('orgData', data, options)
}

export function validateAppDataSync(data: any, version?: string) {
  return validator.validateOnly('appData', data, version)
}

export function validateOrgDataSync(data: any, version?: string) {
  return validator.validateOnly('orgData', data, version)
}