/**
 * Organization Data Migration Definitions
 * 
 * Handles migration of per-organization JSON structure between schema versions.
 */

import { Migration, migrationEngine } from './index'
import { OrgDataSchema } from '../../types/orgData.schemas'

/**
 * Migration: 1.0.0 -> 1.1.0
 * Adds team upload tracking and enhanced metadata
 */
const migration_1_0_0_to_1_1_0: Migration = {
  from: '1.0.0',
  to: '1.1.0',
  description: 'Add team upload tracking and enhanced hunt metadata',
  migrate: (data: any) => {
    return {
      ...data,
      schemaVersion: '1.1.0',
      updatedAt: new Date().toISOString(),
      hunts: data.hunts?.map((hunt: any) => ({
        ...hunt,
        // Add upload tracking to teams if using multi-team model
        teams: hunt.teams?.map((team: any) => ({
          ...team,
          uploads: team.uploads || {
            total: 0,
            photos: 0,
            videos: 0,
            lastUploadedAt: null
          }
        })),
        // Add upload tracking structure for hunt-level uploads
        uploads: hunt.uploads || {
          store: {
            blobsPrefix: `hunts/${hunt.id}/uploads`,
            cloudinaryFolder: `scavenger/entries/${hunt.slug}`
          },
          summary: {
            total: 0,
            photos: 0,
            videos: 0,
            lastUploadedAt: null
          }
        }
      })) || []
    }
  },
  validate: OrgDataSchema
}

/**
 * Migration: 1.1.0 -> 1.2.0
 * Adds video requirements and enhanced stop metadata
 */
const migration_1_1_0_to_1_2_0: Migration = {
  from: '1.1.0',
  to: '1.2.0',
  description: 'Add video requirements and enhanced stop metadata',
  migrate: (data: any) => {
    return {
      ...data,
      schemaVersion: '1.2.0',
      updatedAt: new Date().toISOString(),
      hunts: data.hunts?.map((hunt: any) => ({
        ...hunt,
        stops: hunt.stops?.map((stop: any) => ({
          ...stop,
          // Enhance requirements to support video
          requirements: stop.requirements?.map((req: any) => ({
            ...req,
            type: req.type || 'photo' // Ensure type is specified
          })) || [
            {
              type: 'photo',
              required: true,
              description: 'Photo required'
            }
          ],
          // Add video-specific assets if not present
          assets: stop.assets || []
        })) || []
      })) || []
    }
  },
  validate: OrgDataSchema
}

/**
 * Migration: 0.9.0 -> 1.0.0 (Legacy to current)
 * Transforms legacy organization format to current schema structure
 */
const migration_0_9_0_to_1_0_0: Migration = {
  from: '0.9.0',
  to: '1.0.0',
  description: 'Transform legacy organization format to current schema structure',
  migrate: (data: any) => {
    // Handle various legacy formats
    const legacyData = data
    
    return {
      schemaVersion: '1.0.0',
      etag: legacyData.etag || undefined,
      updatedAt: new Date().toISOString(),
      org: {
        orgSlug: legacyData.orgSlug || legacyData.slug || 'unknown-org',
        orgName: legacyData.orgName || legacyData.name || 'Unknown Organization',
        contacts: Array.isArray(legacyData.contacts) 
          ? legacyData.contacts.map((contact: any) => ({
              firstName: contact.firstName || contact.first_name || 'Unknown',
              lastName: contact.lastName || contact.last_name || 'Contact',
              email: contact.email || contact.contactEmail,
              role: contact.role || contact.position
            }))
          : legacyData.contact
          ? [{
              firstName: legacyData.contact.firstName || 'Unknown',
              lastName: legacyData.contact.lastName || 'Contact', 
              email: legacyData.contact.email,
              role: legacyData.contact.role
            }]
          : [{
              firstName: 'Unknown',
              lastName: 'Contact',
              email: legacyData.contactEmail || 'unknown@example.com'
            }],
        settings: {
          defaultTeams: legacyData.defaultTeams || legacyData.teams || ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE'],
          timezone: legacyData.timezone || legacyData.defaultTimezone || undefined
        }
      },
      hunts: Array.isArray(legacyData.hunts) 
        ? legacyData.hunts.map((hunt: any) => ({
            id: hunt.id || hunt.huntId,
            slug: hunt.slug || hunt.id?.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
            name: hunt.name || hunt.title,
            startDate: hunt.startDate || hunt.date,
            endDate: hunt.endDate || hunt.date,
            time: hunt.time ? {
              start: hunt.time.start,
              end: hunt.time.end,
              timezone: hunt.time.timezone
            } : undefined,
            location: hunt.location ? {
              city: hunt.location.city,
              state: hunt.location.state,
              zip: hunt.location.zip
            } : undefined,
            status: hunt.status || 'scheduled',
            access: {
              visibility: hunt.visibility || hunt.access?.visibility || 'public',
              joinCode: hunt.joinCode || hunt.access?.joinCode,
              pinRequired: hunt.pinRequired || hunt.access?.pinRequired || false
            },
            scoring: {
              basePerStop: hunt.scoring?.basePerStop || hunt.pointsPerStop || 10,
              bonusCreative: hunt.scoring?.bonusCreative || hunt.bonusPoints || 5
            },
            moderation: {
              required: hunt.moderation?.required || hunt.requiresApproval || false,
              reviewers: hunt.moderation?.reviewers || hunt.reviewers || []
            },
            // Transform team data
            teams: hunt.teams?.map((team: any) => ({
              name: team.name || team.teamName,
              captain: {
                firstName: team.captain?.firstName || team.captainName?.split(' ')[0] || 'Unknown',
                lastName: team.captain?.lastName || team.captainName?.split(' ').slice(1).join(' ') || 'Captain',
                email: team.captain?.email || team.captainEmail || ''
              },
              members: team.members || []
            })),
            // Single-team fallback
            teamCaptain: hunt.teamCaptain ? {
              firstName: hunt.teamCaptain.firstName || 'Unknown',
              lastName: hunt.teamCaptain.lastName || 'Captain',
              email: hunt.teamCaptain.email || ''
            } : undefined,
            teamMembers: hunt.teamMembers || undefined,
            uploads: {
              summary: {
                total: hunt.uploadCount || 0,
                photos: hunt.photoCount || 0,
                videos: hunt.videoCount || 0,
                lastUploadedAt: hunt.lastUpload || undefined
              }
            },
            stops: hunt.stops?.map((stop: any) => ({
              id: stop.id || stop.stopId,
              title: stop.title || stop.name,
              lat: parseFloat(stop.lat || stop.latitude || 0),
              lng: parseFloat(stop.lng || stop.longitude || 0),
              radiusMeters: stop.radiusMeters || stop.radius || 50,
              description: stop.description,
              difficulty: stop.difficulty,
              hints: Array.isArray(stop.hints) 
                ? stop.hints.map((hint: any) => ({
                    text: typeof hint === 'string' ? hint : hint.text,
                    delay: hint.delay
                  }))
                : [],
              requirements: stop.requirements?.map((req: any) => ({
                type: req.type || 'photo',
                required: req.required !== false,
                description: req.description
              })) || [
                {
                  type: 'photo',
                  required: true,
                  description: 'Photo required'
                }
              ],
              assets: stop.assets || [],
              audit: stop.audit || undefined
            })) || [],
            rules: hunt.rules ? {
              id: hunt.rules.id || `${hunt.id}-rules`,
              version: hunt.rules.version || '1.0',
              updatedAt: hunt.rules.updatedAt || new Date().toISOString(),
              acknowledgement: {
                required: hunt.rules.acknowledgement?.required || false,
                text: hunt.rules.acknowledgement?.text || 'I acknowledge the hunt rules'
              },
              content: {
                format: hunt.rules.content?.format || 'markdown',
                body: hunt.rules.content?.body || hunt.rules.text || ''
              },
              categories: hunt.rules.categories
            } : undefined,
            audit: hunt.audit || undefined
          }))
        : []
    }
  },
  validate: OrgDataSchema
}

/**
 * Register all organization data migrations
 */
export function registerOrgDataMigrations() {
  migrationEngine.registerMigration('orgData', migration_0_9_0_to_1_0_0)
  migrationEngine.registerMigration('orgData', migration_1_0_0_to_1_1_0) 
  migrationEngine.registerMigration('orgData', migration_1_1_0_to_1_2_0)
  
  console.log('✅ Org Data migrations registered:', migrationEngine.getAvailableVersions('orgData'))
}

/**
 * Utility function to migrate organization data to latest version
 */
export async function migrateOrgDataToLatest(data: any, currentVersion?: string) {
  const detectedVersion = currentVersion || data.schemaVersion || '0.9.0'
  const targetVersion = '1.2.0' // Latest version
  
  return migrationEngine.migrate('orgData', data, detectedVersion, targetVersion)
}