/**
 * Migration utilities for Organization JSON data
 * Handles versioned schema migrations with type safety
 */

import { OrgDataSchema, CURRENT_ORG_SCHEMA_VERSION } from '../../types/orgData.schemas'
import type { OrgData } from '../../types/orgData.schemas'

/**
 * Migrates Organization JSON data from any version to the current schema version
 * @param data Raw data from storage (unknown format)
 * @returns Validated and migrated OrgData
 */
export function migrateOrgJson(data: unknown): OrgData {
  // TODO: Phase 3 - Implement version detection and migration chain
  
  // For now, attempt direct validation with current schema
  // This will be expanded in future phases with per-version migration steps
  try {
    const result = OrgDataSchema.parse(data)
    return result
  } catch (error) {
    console.warn('Org JSON migration failed, cannot create default:', error)
    throw new Error(`Failed to migrate organization data: ${error}`)
  }
}

/**
 * Migration step: v1.0.0 -> v1.1.0 (placeholder)
 * TODO: Implement when we have schema version 1.1.0
 */
function migrateOrgJson_v1_0_to_v1_1(data: any): any {
  // TODO: Add migration logic for specific version changes
  // Example: Add new required fields, transform hunt structures, etc.
  return data
}

/**
 * Migration step: v1.1.0 -> v1.2.0 (placeholder)
 * TODO: Implement when we have schema version 1.2.0
 */
function migrateOrgJson_v1_1_to_v1_2(data: any): any {
  // TODO: Add migration logic for specific version changes
  return data
}

/**
 * Create a minimal valid Organization JSON structure
 * @param orgSlug Organization identifier
 * @param orgName Organization display name
 * @param contactEmail Primary contact email
 */
export function createMinimalOrgJson(
  orgSlug: string,
  orgName: string,
  contactEmail: string
): OrgData {
  return OrgDataSchema.parse({
    schemaVersion: CURRENT_ORG_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    org: {
      orgSlug,
      orgName,
      contacts: [
        {
          firstName: 'Primary',
          lastName: 'Contact',
          email: contactEmail,
          role: 'Administrator'
        }
      ],
      settings: {
        defaultTeams: ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']
      }
    },
    hunts: []
  })
}

/**
 * Validate organization data without migration
 * Useful for checking data integrity
 */
export function validateOrgJson(data: unknown): { valid: boolean; errors?: any } {
  try {
    OrgDataSchema.parse(data)
    return { valid: true }
  } catch (error) {
    return { valid: false, errors: error }
  }
}