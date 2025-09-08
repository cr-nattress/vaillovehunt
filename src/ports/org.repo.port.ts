/**
 * Organization Repository Port
 * 
 * Clean interface for organization and app data access operations.
 * Adapters will implement this interface for different storage backends.
 */

import { AppData } from '../types/appData.schemas'
import { OrgData } from '../types/orgData.schemas'

export interface ETagged<T> {
  data: T
  etag?: string
}

export interface BlobResult<T> {
  data: T
  etag?: string
}

export interface GetOrgInput {
  orgSlug: string
}

export interface UpsertOrgInput {
  orgSlug: string
  orgData: OrgData
  expectedEtag?: string
}

export interface UpsertAppInput {
  appData: AppData
  expectedEtag?: string
}

export interface ListOrgsInput {
  limit?: number
  offset?: number
  nameFilter?: string
}

export interface OrgSummary {
  orgSlug: string
  orgName: string
  createdAt: string
  updatedAt: string
  huntCount?: number
}

/**
 * Port interface for organization and app repository operations
 */
export interface OrgRepoPort {
  /**
   * Get the global app configuration and index data
   */
  getApp(): Promise<BlobResult<AppData>>
  
  /**
   * Get organization data by slug
   */
  getOrg(input: GetOrgInput): Promise<BlobResult<OrgData>>
  
  /**
   * List all organizations with optional filtering
   */
  listOrgs(input?: ListOrgsInput): Promise<OrgSummary[]>
  
  /**
   * Create or update organization data with optional optimistic concurrency control
   */
  upsertOrg(input: UpsertOrgInput): Promise<string | undefined>
  
  /**
   * Update the global app configuration with optional optimistic concurrency control
   */
  upsertApp(input: UpsertAppInput): Promise<string | undefined>
}