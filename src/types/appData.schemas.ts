/**
 * Zod schemas for App JSON data structures
 * Global application metadata and organization registry
 */

import { z } from 'zod'

// Base metadata schemas
export const AppMetadataSchema = z.object({
  name: z.string(),
  environment: z.string(),
  uiVersion: z.string().optional(),
})

export const AppFeaturesSchema = z.object({
  enableKVEvents: z.boolean().default(false),
  enableBlobEvents: z.boolean().default(false),
  enablePhotoUpload: z.boolean().default(true),
  enableMapPage: z.boolean().default(false),
})

export const AppDefaultsSchema = z.object({
  timezone: z.string().default('America/Denver'),
  locale: z.string().default('en-US'),
})

export const AppMapSchema = z.object({
  tileProvider: z.string().optional(),
  tileUrl: z.string().optional(),
  attribution: z.string().optional(),
})

export const AppEmailSchema = z.object({
  fromAddress: z.string().email().optional(),
  sendingEnabled: z.boolean().default(false),
})

export const AppPrivacySchema = z.object({
  mediaRetentionDays: z.number().default(365),
  dataDeletionContact: z.string().email().optional(),
})

export const AppLimitsSchema = z.object({
  maxUploadSizeMB: z.number().default(10),
  maxPhotosPerTeam: z.number().default(100),
  allowedMediaTypes: z.array(z.string()).default(['image/jpeg', 'image/png']),
})

// Organization summary schema
export const OrgSummarySchema = z.object({
  huntsTotal: z.number().default(0),
  teamsCommon: z.array(z.string()).default([]),
})

export const OrganizationSummarySchema = z.object({
  orgSlug: z.string(),
  orgName: z.string(),
  primaryContactEmail: z.string().email(),
  createdAt: z.string(),
  orgBlobKey: z.string(),
  summary: OrgSummarySchema.optional(),
})

// Date index schema for fast lookups
export const HuntIndexEntrySchema = z.object({
  orgSlug: z.string(),
  huntId: z.string(),
})

export const DateIndexSchema = z.record(
  z.string(), // YYYY-MM-DD format
  z.array(HuntIndexEntrySchema)
)

// Main App JSON schema
export const AppDataSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  etag: z.string().optional(),
  updatedAt: z.string(),
  app: z.object({
    metadata: AppMetadataSchema,
    features: AppFeaturesSchema,
    defaults: AppDefaultsSchema,
    map: AppMapSchema.optional(),
    email: AppEmailSchema.optional(),
    privacy: AppPrivacySchema.optional(),
    limits: AppLimitsSchema.optional(),
  }),
  organizations: z.array(OrganizationSummarySchema),
  byDate: DateIndexSchema.optional(),
})

// Export types
export type AppMetadata = z.infer<typeof AppMetadataSchema>
export type AppFeatures = z.infer<typeof AppFeaturesSchema>
export type AppDefaults = z.infer<typeof AppDefaultsSchema>
export type AppMap = z.infer<typeof AppMapSchema>
export type AppEmail = z.infer<typeof AppEmailSchema>
export type AppPrivacy = z.infer<typeof AppPrivacySchema>
export type AppLimits = z.infer<typeof AppLimitsSchema>
export type OrgSummary = z.infer<typeof OrgSummarySchema>
export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>
export type HuntIndexEntry = z.infer<typeof HuntIndexEntrySchema>
export type DateIndex = z.infer<typeof DateIndexSchema>
export type AppData = z.infer<typeof AppDataSchema>