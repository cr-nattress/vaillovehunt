/**
 * Tests for Organization JSON data schemas
 */

import { describe, it, expect } from 'vitest'
import { 
  OrgDataSchema,
  HuntSchema,
  RulesSchema,
  StopSchema,
  TeamAssignmentSchema
} from '../orgData.schemas'

describe('OrgData Schemas', () => {
  describe('RulesSchema', () => {
    it('should validate rules with markdown content', () => {
      const validRules = {
        id: 'hunt-rules-v1',
        version: '1.0',
        content: {
          format: 'markdown' as const,
          body: '# Hunt Rules\n\n1. Be respectful\n2. Have fun!'
        },
        acknowledgement: {
          required: true,
          text: 'I agree to follow all hunt rules'
        },
        categories: ['safety', 'conduct'],
        updatedAt: new Date().toISOString()
      }

      const result = RulesSchema.parse(validRules)
      expect(result).toEqual(validRules)
      expect(result.content.format).toBe('markdown')
    })

    it('should validate rules with plain text content', () => {
      const validRules = {
        id: 'simple-rules',
        content: {
          format: 'text' as const,
          body: 'Simple text rules here'
        },
        acknowledgement: {
          required: false,
          text: 'Optional acknowledgement'
        }
      }

      const result = RulesSchema.parse(validRules)
      expect(result.content.format).toBe('text')
      expect(result.acknowledgement.required).toBe(false)
    })

    it('should apply default values', () => {
      const minimalRules = {
        id: 'basic-rules',
        content: {
          body: 'Basic rules'
        },
        acknowledgement: {
          required: true,
          text: 'I acknowledge'
        }
      }

      const result = RulesSchema.parse(minimalRules)
      expect(result.content.format).toBe('text') // Default format
      expect(result.categories).toEqual([]) // Default empty array
    })
  })

  describe('StopSchema', () => {
    it('should validate a complete stop', () => {
      const validStop = {
        id: 'stop-001',
        name: 'Town Square',
        description: 'Take a photo at the town square statue',
        location: {
          lat: 39.6403,
          lng: -106.3742,
          address: '123 Main St, Vail, CO 81657'
        },
        hints: ['Look for the bronze statue', 'Near the clock tower'],
        rules: {
          id: 'stop-rules',
          content: {
            format: 'text' as const,
            body: 'Photo must include the full statue'
          },
          acknowledgement: {
            required: false,
            text: ''
          }
        },
        scoring: {
          basePoints: 10,
          bonusPoints: 5,
          penalties: []
        },
        media: {
          requiredTypes: ['photo'],
          maxCount: 1,
          requirements: ['Must show full statue']
        }
      }

      const result = StopSchema.parse(validStop)
      expect(result).toEqual(validStop)
    })

    it('should validate minimal stop', () => {
      const minimalStop = {
        id: 'minimal-stop',
        name: 'Basic Stop',
        description: 'Basic stop description'
      }

      const result = StopSchema.parse(minimalStop)
      expect(result.id).toBe('minimal-stop')
      expect(result.hints).toEqual([])
      expect(result.scoring.basePoints).toBe(10) // Default
      expect(result.media.requiredTypes).toEqual(['photo']) // Default
      expect(result.media.maxCount).toBe(1) // Default
    })

    it('should validate location coordinates', () => {
      const stopWithInvalidLat = {
        id: 'stop-001',
        name: 'Test Stop',
        description: 'Test description',
        location: {
          lat: 91, // Invalid latitude > 90
          lng: -106.3742,
          address: '123 Test St'
        }
      }

      expect(() => StopSchema.parse(stopWithInvalidLat)).toThrow()
    })
  })

  describe('TeamAssignmentSchema', () => {
    it('should validate team assignment with participants', () => {
      const validAssignment = {
        teamName: 'RED',
        participants: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' }
        ],
        metadata: {
          captain: 'John Doe',
          specialRequirements: []
        }
      }

      const result = TeamAssignmentSchema.parse(validAssignment)
      expect(result).toEqual(validAssignment)
      expect(result.participants).toHaveLength(2)
    })

    it('should validate team assignment without participants', () => {
      const assignment = {
        teamName: 'BLUE',
        participants: []
      }

      const result = TeamAssignmentSchema.parse(assignment)
      expect(result.teamName).toBe('BLUE')
      expect(result.participants).toEqual([])
    })
  })

  describe('HuntSchema', () => {
    it('should validate complete hunt structure', () => {
      const validHunt = {
        id: 'summer-hunt-20250808',
        slug: 'summer-hunt',
        name: 'Summer Hunt 2025',
        startDate: '2025-08-08',
        endDate: '2025-08-08',
        status: 'active' as const,
        access: {
          visibility: 'public' as const,
          pinRequired: false,
          pin: undefined
        },
        rules: {
          id: 'hunt-rules',
          content: {
            format: 'markdown' as const,
            body: '# Hunt Rules\n\nHave fun and be safe!'
          },
          acknowledgement: {
            required: true,
            text: 'I agree to the hunt rules'
          }
        },
        teams: [
          {
            teamName: 'RED',
            participants: [
              { name: 'John Doe', email: 'john@example.com' }
            ]
          }
        ],
        stops: [
          {
            id: 'stop-001',
            name: 'First Stop',
            description: 'Find the first location'
          }
        ],
        scoring: {
          basePerStop: 10,
          bonusCreative: 5,
          penalties: {
            lateSubmission: -2,
            ruleViolation: -5
          }
        },
        moderation: {
          required: false,
          reviewers: []
        },
        audit: {
          createdBy: 'admin@example.com',
          createdAt: new Date().toISOString()
        }
      }

      const result = HuntSchema.parse(validHunt)
      expect(result).toEqual(validHunt)
      expect(result.status).toBe('active')
      expect(result.teams).toHaveLength(1)
      expect(result.stops).toHaveLength(1)
    })

    it('should apply default values', () => {
      const minimalHunt = {
        id: 'basic-hunt',
        slug: 'basic',
        name: 'Basic Hunt',
        startDate: '2025-08-08',
        endDate: '2025-08-08',
        access: {
          visibility: 'public' as const
        },
        audit: {
          createdBy: 'test@example.com',
          createdAt: new Date().toISOString()
        }
      }

      const result = HuntSchema.parse(minimalHunt)
      expect(result.status).toBe('scheduled') // Default status
      expect(result.access.pinRequired).toBe(false) // Default
      expect(result.teams).toEqual([]) // Default empty array
      expect(result.stops).toEqual([]) // Default empty array
      expect(result.scoring.basePerStop).toBe(10) // Default
      expect(result.scoring.bonusCreative).toBe(5) // Default
      expect(result.moderation.required).toBe(false) // Default
      expect(result.moderation.reviewers).toEqual([]) // Default
    })

    it('should validate hunt status enum', () => {
      const huntWithInvalidStatus = {
        id: 'test-hunt',
        slug: 'test',
        name: 'Test Hunt',
        startDate: '2025-08-08',
        endDate: '2025-08-08',
        status: 'invalid-status',
        access: { visibility: 'public' as const },
        audit: {
          createdBy: 'test@example.com',
          createdAt: new Date().toISOString()
        }
      }

      expect(() => HuntSchema.parse(huntWithInvalidStatus)).toThrow()
    })
  })

  describe('OrgDataSchema', () => {
    it('should validate complete organization data', () => {
      const validOrg = {
        schemaVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'test-org',
          orgName: 'Test Organization',
          contacts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          ],
          settings: {
            defaultTeams: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            timezone: 'America/Denver',
            locale: 'en-US'
          }
        },
        hunts: [
          {
            id: 'test-hunt',
            slug: 'test',
            name: 'Test Hunt',
            startDate: '2025-08-08',
            endDate: '2025-08-08',
            access: { visibility: 'public' as const },
            audit: {
              createdBy: 'admin@example.com',
              createdAt: new Date().toISOString()
            }
          }
        ]
      }

      const result = OrgDataSchema.parse(validOrg)
      expect(result.schemaVersion).toBe('1.0.0')
      expect(result.org.orgSlug).toBe('test-org')
      expect(result.hunts).toHaveLength(1)
      expect(result.org.contacts).toHaveLength(1)
    })

    it('should apply default values', () => {
      const minimalOrg = {
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'minimal-org',
          orgName: 'Minimal Organization',
          contacts: [
            {
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com'
            }
          ]
        },
        hunts: []
      }

      const result = OrgDataSchema.parse(minimalOrg)
      expect(result.schemaVersion).toBe('1.0.0') // Default
      expect(result.org.settings.defaultTeams).toEqual(['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']) // Default
      expect(result.org.settings.timezone).toBe('America/Denver') // Default
      expect(result.org.settings.locale).toBe('en-US') // Default
    })

    it('should require at least one contact', () => {
      const orgWithoutContacts = {
        updatedAt: new Date().toISOString(),
        org: {
          orgSlug: 'no-contacts',
          orgName: 'No Contacts Org',
          contacts: []
        },
        hunts: []
      }

      expect(() => OrgDataSchema.parse(orgWithoutContacts)).toThrow()
    })
  })
})