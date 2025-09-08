/**
 * Organization Data Schema Versions
 * 
 * Historical schema definitions for Organization JSON data structure validation.
 */

import { z } from 'zod'
import { schemaVersions } from './index'
import { OrgDataSchema } from '../../types/orgData.schemas'

/**
 * Organization Data Schema v0.9.0 (Legacy)
 * Original structure before comprehensive team and hunt modeling
 */
const OrgDataSchema_0_9_0 = z.object({
  schemaVersion: z.string().default('0.9.0'),
  etag: z.string().optional(),
  orgSlug: z.string().optional(),
  orgName: z.string().optional(),
  name: z.string().optional(), // Alternative field name
  slug: z.string().optional(),  // Alternative field name
  
  // Legacy contact structure (single contact or simple structure)
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    first_name: z.string().optional(), // Alternative naming
    last_name: z.string().optional(),
    email: z.string().email(),
    contactEmail: z.string().email().optional(), // Alternative field
    role: z.string().optional(),
    position: z.string().optional() // Alternative field
  }).optional(),
  contactEmail: z.string().email().optional(), // Direct field
  contacts: z.array(z.any()).optional(), // Allow any structure for legacy
  
  // Legacy simple configuration
  defaultTeams: z.array(z.string()).optional(),
  teams: z.array(z.string()).optional(), // Alternative field
  timezone: z.string().optional(),
  defaultTimezone: z.string().optional(), // Alternative field
  
  // Legacy hunt structure (less structured)
  hunts: z.array(z.object({
    id: z.string().optional(),
    huntId: z.string().optional(), // Alternative field
    slug: z.string().optional(),
    name: z.string().optional(),
    title: z.string().optional(), // Alternative field
    date: z.string().optional(), // Single date field
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    time: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      timezone: z.string().optional()
    }).optional(),
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional()
    }).optional(),
    
    // Legacy status and access
    status: z.string().optional(),
    visibility: z.string().optional(),
    access: z.object({
      visibility: z.string().optional(),
      joinCode: z.string().optional(),
      pinRequired: z.boolean().optional()
    }).optional(),
    joinCode: z.string().optional(), // Direct field
    pinRequired: z.boolean().optional(),
    
    // Legacy scoring
    pointsPerStop: z.number().optional(),
    bonusPoints: z.number().optional(),
    scoring: z.object({
      basePerStop: z.number().optional(),
      bonusCreative: z.number().optional()
    }).optional(),
    
    // Legacy moderation
    requiresApproval: z.boolean().optional(),
    reviewers: z.array(z.string()).optional(),
    moderation: z.object({
      required: z.boolean().optional(),
      reviewers: z.array(z.string()).optional()
    }).optional(),
    
    // Legacy team structures
    teams: z.array(z.object({
      name: z.string().optional(),
      teamName: z.string().optional(),
      captain: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional()
      }).optional(),
      captainName: z.string().optional(), // Alternative field
      captainEmail: z.string().optional(),
      members: z.array(z.any()).optional()
    })).optional(),
    
    // Single-team fallback
    teamCaptain: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional()
    }).optional(),
    teamMembers: z.array(z.any()).optional(),
    
    // Legacy upload tracking
    uploadCount: z.number().optional(),
    photoCount: z.number().optional(),
    videoCount: z.number().optional(),
    lastUpload: z.string().optional(),
    
    // Legacy stop structure
    stops: z.array(z.object({
      id: z.string().optional(),
      stopId: z.string().optional(),
      name: z.string().optional(),
      title: z.string().optional(),
      lat: z.union([z.number(), z.string()]).optional(),
      lng: z.union([z.number(), z.string()]).optional(),
      latitude: z.union([z.number(), z.string()]).optional(), // Alternative
      longitude: z.union([z.number(), z.string()]).optional(),
      radius: z.number().optional(),
      radiusMeters: z.number().optional(),
      description: z.string().optional(),
      difficulty: z.string().optional(),
      hints: z.array(z.union([
        z.string(),
        z.object({
          text: z.string(),
          delay: z.number().optional()
        })
      ])).optional(),
      requirements: z.array(z.object({
        type: z.string().optional(),
        required: z.boolean().optional(),
        description: z.string().optional()
      })).optional(),
      assets: z.array(z.any()).optional(),
      audit: z.any().optional()
    })).optional(),
    
    // Legacy rules
    rules: z.object({
      id: z.string().optional(),
      version: z.string().optional(),
      updatedAt: z.string().optional(),
      text: z.string().optional(), // Direct text field
      content: z.object({
        format: z.string().optional(),
        body: z.string().optional()
      }).optional(),
      acknowledgement: z.object({
        required: z.boolean().optional(),
        text: z.string().optional()
      }).optional(),
      categories: z.array(z.string()).optional()
    }).optional(),
    
    audit: z.any().optional()
  })).optional(),
  
  updatedAt: z.string().optional()
})

/**
 * Organization Data Schema v1.0.0
 * Current structured format with comprehensive modeling
 */
const OrgDataSchema_1_0_0 = z.object({
  schemaVersion: z.string().default('1.0.0'),
  etag: z.string().optional(),
  updatedAt: z.string(),
  org: z.object({
    orgSlug: z.string(),
    orgName: z.string(),
    contacts: z.array(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      role: z.string().optional(),
    })),
    settings: z.object({
      defaultTeams: z.array(z.string()).default(['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']),
      timezone: z.string().optional(),
    }),
  }),
  hunts: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['scheduled', 'active', 'completed', 'archived']).default('scheduled'),
    // ... rest of current hunt schema structure
  })).default([]),
})

/**
 * Organization Data Schema v1.1.0
 * Adds team upload tracking and enhanced metadata
 */
const OrgDataSchema_1_1_0 = OrgDataSchema_1_0_0.extend({
  schemaVersion: z.string().default('1.1.0'),
  hunts: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['scheduled', 'active', 'completed', 'archived']).default('scheduled'),
    // Enhanced with upload tracking
    uploads: z.object({
      store: z.object({
        blobsPrefix: z.string().optional(),
        cloudinaryFolder: z.string().optional(),
      }).optional(),
      summary: z.object({
        total: z.number().default(0),
        photos: z.number().default(0),
        videos: z.number().default(0),
        lastUploadedAt: z.string().optional(),
      }),
    }).optional(),
    // ... rest would mirror current schema
  })).default([]),
})

/**
 * Register all Organization Data schema versions
 */
export function registerOrgDataVersions() {
  // Legacy version (deprecated)
  schemaVersions.registerVersion('orgData', {
    version: '0.9.0',
    schema: OrgDataSchema_0_9_0,
    description: 'Legacy structure before comprehensive team and hunt modeling',
    deprecated: true,
    migrationTarget: '1.0.0'
  })

  // Version 1.0.0 (stable)
  schemaVersions.registerVersion('orgData', {
    version: '1.0.0', 
    schema: OrgDataSchema_1_0_0,
    description: 'Current structured format with comprehensive modeling'
  })

  // Version 1.1.0 (with upload tracking)
  schemaVersions.registerVersion('orgData', {
    version: '1.1.0',
    schema: OrgDataSchema_1_1_0,
    description: 'Adds team upload tracking and enhanced hunt metadata'
  })

  // Version 1.2.0 (latest - uses current schema from types)
  schemaVersions.registerVersion('orgData', {
    version: '1.2.0',
    schema: OrgDataSchema,
    description: 'Latest version with video requirements and enhanced stop metadata'
  })

  console.log('✅ Org Data schema versions registered:', schemaVersions.getVersions('orgData'))
}