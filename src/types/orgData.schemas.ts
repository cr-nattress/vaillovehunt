/**
 * Zod schemas for Organization JSON data structures
 * Per-organization data including hunts, teams, and detailed metadata
 */

import { z } from 'zod'

// Contact schema
export const ContactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
})

// Organization settings
export const OrgSettingsSchema = z.object({
  defaultTeams: z.array(z.string()).default(['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']),
  timezone: z.string().optional(),
})

// Hunt-related schemas
export const HuntAccessSchema = z.object({
  visibility: z.enum(['public', 'invite', 'private']).default('public'),
  joinCode: z.string().optional(),
  pinRequired: z.boolean().default(false),
})

export const HuntScoringSchema = z.object({
  basePerStop: z.number().default(10),
  bonusCreative: z.number().default(5),
})

export const HuntModerationSchema = z.object({
  required: z.boolean().default(false),
  reviewers: z.array(z.string()).default([]),
})

export const HuntTimeSchema = z.object({
  start: z.string().optional(), // HH:MM format
  end: z.string().optional(),   // HH:MM format
  timezone: z.string().optional(),
})

// Team schemas (multi-team model)
export const TeamCaptainSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
})

export const TeamMemberSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
})

export const TeamUploadsSchema = z.object({
  total: z.number().default(0),
  photos: z.number().default(0),
  videos: z.number().default(0),
  lastUploadedAt: z.string().optional(),
})

export const TeamSchema = z.object({
  name: z.string(),
  captain: TeamCaptainSchema,
  members: z.array(TeamMemberSchema).default([]),
  uploads: TeamUploadsSchema.optional(),
})

// Hunt uploads (single-team model)
export const HuntUploadStoreSchema = z.object({
  blobsPrefix: z.string().optional(),
  cloudinaryFolder: z.string().optional(),
})

export const HuntUploadSummarySchema = z.object({
  total: z.number().default(0),
  photos: z.number().default(0),
  videos: z.number().default(0),
  lastUploadedAt: z.string().optional(),
})

export const HuntUploadsSchema = z.object({
  store: HuntUploadStoreSchema.optional(),
  summary: HuntUploadSummarySchema,
  // items: z.array(z.any()).optional(), // TODO: Define upload item schema later
  // indices: z.object({ byStop: z.record(z.array(z.string())) }).optional(),
})

// Stop schema
export const HintSchema = z.object({
  text: z.string(),
  delay: z.number().optional(), // Minutes before hint is available
})

export const StopRequirementSchema = z.object({
  type: z.enum(['photo', 'video', 'text']).default('photo'),
  required: z.boolean().default(true),
  description: z.string().optional(),
})

export const StopAssetSchema = z.object({
  type: z.enum(['image', 'video', 'audio']),
  url: z.string().url(),
  caption: z.string().optional(),
})

export const StopAuditSchema = z.object({
  createdBy: z.string(),
  createdAt: z.string(),
  lastModifiedBy: z.string().optional(),
  lastModifiedAt: z.string().optional(),
})

export const StopSchema = z.object({
  id: z.string(),
  title: z.string(),
  lat: z.number(),
  lng: z.number(),
  radiusMeters: z.number().default(50),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  hints: z.array(HintSchema).default([]),
  requirements: z.array(StopRequirementSchema).default([]),
  assets: z.array(StopAssetSchema).default([]),
  audit: StopAuditSchema.optional(),
})

// Rules schema
export const RulesAcknowledgementSchema = z.object({
  required: z.boolean().default(false),
  text: z.string().default('I acknowledge that I have read and agree to follow these rules.'),
})

export const RulesContentSchema = z.object({
  format: z.enum(['markdown', 'plain', 'html']).default('markdown'),
  body: z.string(),
})

export const RulesSchema = z.object({
  id: z.string(),
  version: z.string().default('1.0'),
  updatedAt: z.string(),
  acknowledgement: RulesAcknowledgementSchema,
  content: RulesContentSchema,
  categories: z.array(z.string()).optional(),
})

// Hunt statistics
export const HuntStatsSchema = z.object({
  teamsRegistered: z.number().default(0),
  photosSubmitted: z.number().default(0),
  completedStops: z.number().default(0),
})

// Hunt location schema
export const HuntLocationSchema = z.object({
  city: z.string(),
  state: z.string(),
  zip: z.string(),
})

// Main Hunt schema
export const HuntSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  startDate: z.string(), // YYYY-MM-DD format
  endDate: z.string(),   // YYYY-MM-DD format
  time: HuntTimeSchema.optional(),
  location: HuntLocationSchema.optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'archived']).default('scheduled'),
  access: HuntAccessSchema,
  scoring: HuntScoringSchema,
  moderation: HuntModerationSchema,
  
  // Choose one team model per organization
  teams: z.array(TeamSchema).optional(), // Multi-team model
  teamCaptain: TeamCaptainSchema.optional(), // Single-team model
  teamMembers: z.array(TeamMemberSchema).optional(), // Single-team model
  
  uploads: HuntUploadsSchema.optional(),
  stops: z.array(StopSchema).default([]),
  rules: RulesSchema.optional(),
  
  // Optional fields
  geo: z.any().optional(), // Geographic bounds/polygons
  stats: HuntStatsSchema.optional(),
  audit: z.object({
    createdBy: z.string(),
    createdAt: z.string(),
    archivedAt: z.string().optional(),
  }).optional(),
})

// Main Organization JSON schema
export const OrgDataSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  etag: z.string().optional(),
  updatedAt: z.string(),
  org: z.object({
    orgSlug: z.string(),
    orgName: z.string(),
    contacts: z.array(ContactSchema),
    settings: OrgSettingsSchema,
  }),
  hunts: z.array(HuntSchema).default([]),
})

// Export types
export type Contact = z.infer<typeof ContactSchema>
export type OrgSettings = z.infer<typeof OrgSettingsSchema>
export type HuntAccess = z.infer<typeof HuntAccessSchema>
export type HuntScoring = z.infer<typeof HuntScoringSchema>
export type HuntModeration = z.infer<typeof HuntModerationSchema>
export type HuntTime = z.infer<typeof HuntTimeSchema>
export type TeamCaptain = z.infer<typeof TeamCaptainSchema>
export type TeamMember = z.infer<typeof TeamMemberSchema>
export type TeamUploads = z.infer<typeof TeamUploadsSchema>
export type Team = z.infer<typeof TeamSchema>
export type HuntUploadStore = z.infer<typeof HuntUploadStoreSchema>
export type HuntUploadSummary = z.infer<typeof HuntUploadSummarySchema>
export type HuntUploads = z.infer<typeof HuntUploadsSchema>
export type Hint = z.infer<typeof HintSchema>
export type StopRequirement = z.infer<typeof StopRequirementSchema>
export type StopAsset = z.infer<typeof StopAssetSchema>
export type StopAudit = z.infer<typeof StopAuditSchema>
export type Stop = z.infer<typeof StopSchema>
export type RulesAcknowledgement = z.infer<typeof RulesAcknowledgementSchema>
export type RulesContent = z.infer<typeof RulesContentSchema>
export type Rules = z.infer<typeof RulesSchema>
export type HuntStats = z.infer<typeof HuntStatsSchema>
export type HuntLocation = z.infer<typeof HuntLocationSchema>
export type Hunt = z.infer<typeof HuntSchema>
export type OrgData = z.infer<typeof OrgDataSchema>