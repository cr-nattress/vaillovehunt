/**
 * Service for seeding initial app data
 * This helps populate the app with demo data for splash screen and testing
 */

import seedData from '../data/seed-data.json'
import { DualWriteService } from '../client/DualWriteService'

export interface SeedOptions {
  skipExisting?: boolean
  seedProgress?: boolean
  teams?: string[]
}

export class SeedService {
  private static instance: SeedService

  private constructor() {
    // DualWriteService uses static methods, no instance needed
  }

  public static getInstance(): SeedService {
    if (!SeedService.instance) {
      SeedService.instance = new SeedService()
    }
    return SeedService.instance
  }

  /**
   * Seed the app with initial data from seed-data.json
   */
  public async seedAppData(options: SeedOptions = {}): Promise<void> {
    console.log('🌱 SeedService: Starting data seeding...', options)

    try {
      // 1. Seed app settings if they don't exist or skipExisting is false
      await this.seedAppSettings(options.skipExisting)

      // 2. Seed today's events for splash screen display
      await this.seedTodaysEvents(options.skipExisting)

      // 3. Seed sample progress for specified teams (if enabled)
      if (options.seedProgress) {
        await this.seedSampleProgress(options.teams)
      }

      console.log('✅ SeedService: Data seeding completed successfully')
    } catch (error) {
      console.error('❌ SeedService: Failed to seed data:', error)
      throw error
    }
  }

  /**
   * Seed initial app settings
   */
  private async seedAppSettings(skipExisting: boolean = true): Promise<void> {
    console.log('🌱 SeedService: Seeding app settings...')

    try {
      // Check if app-settings already exist
      const existingSettings = await DualWriteService.get('app-settings')
      
      if (skipExisting && existingSettings) {
        console.log('⏭️ SeedService: App settings already exist, skipping')
        return
      }

      // Set the app settings from seed data
      const appSettings = seedData['app-settings']
      await DualWriteService.set('app-settings', appSettings)
      
      console.log('✅ SeedService: App settings seeded:', appSettings)
    } catch (error) {
      console.error('❌ SeedService: Failed to seed app settings:', error)
      throw error
    }
  }

  /**
   * Seed today's events for splash screen display
   */
  private async seedTodaysEvents(skipExisting: boolean = true): Promise<void> {
    console.log('🌱 SeedService: Seeding today\'s events for splash screen...')

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      const eventsData = seedData['today-events'] as Record<string, any>
      
      for (const [eventId, eventData] of Object.entries(eventsData)) {
        const eventKey = `events/${todayStr}/${eventData.orgSlug}.json`
        
        // Check if event already exists
        if (skipExisting) {
          const existingEvent = await DualWriteService.get(eventKey)
          if (existingEvent) {
            console.log(`⏭️ SeedService: Event ${eventId} already exists, skipping`)
            continue
          }
        }
        
        // Seed the event data in the format EventService expects
        await DualWriteService.set(eventKey, eventData)
        console.log(`✅ SeedService: Event seeded: ${eventKey}`, eventData)
      }
      
    } catch (error) {
      console.error('❌ SeedService: Failed to seed today\'s events:', error)
      throw error
    }
  }

  /**
   * Seed sample progress data for teams
   */
  private async seedSampleProgress(teams?: string[]): Promise<void> {
    if (!teams || teams.length === 0) {
      console.log('⏭️ SeedService: No teams specified for progress seeding')
      return
    }

    console.log('🌱 SeedService: Seeding sample progress for teams:', teams)

    const sampleProgress = seedData['sample-progress'] as Record<string, any>

    for (const teamName of teams) {
      if (sampleProgress[teamName]) {
        try {
          const progressKey = `progress:BHHS:Vail:${teamName}`
          const teamProgress = sampleProgress[teamName]
          
          // Check if progress already exists
          const existingProgress = await DualWriteService.get(progressKey)
          if (existingProgress) {
            console.log(`⏭️ SeedService: Progress for ${teamName} already exists, skipping`)
            continue
          }

          await DualWriteService.set(progressKey, teamProgress)
          console.log(`✅ SeedService: Sample progress seeded for ${teamName}:`, teamProgress)
        } catch (error) {
          console.error(`❌ SeedService: Failed to seed progress for ${teamName}:`, error)
        }
      } else {
        console.log(`⚠️ SeedService: No sample progress data found for team ${teamName}`)
      }
    }
  }

  /**
   * Get available teams from seed data
   */
  public getAvailableTeams(): string[] {
    return seedData.teams.map(team => team.name)
  }

  /**
   * Get organization info
   */
  public getOrganization(id: string) {
    return seedData.organizations.find(org => org.id === id)
  }

  /**
   * Get event info
   */
  public getEvent(id: string) {
    return seedData.events.find(event => event.id === id)
  }

  /**
   * Clear all seeded data (useful for testing)
   */
  public async clearSeedData(): Promise<void> {
    console.log('🧹 SeedService: Clearing seeded data...')

    try {
      // Clear app settings
      await DualWriteService.delete('app-settings')

      // Clear today's events
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const eventsData = seedData['today-events'] as Record<string, any>
      
      for (const [eventId, eventData] of Object.entries(eventsData)) {
        const eventKey = `events/${todayStr}/${eventData.orgSlug}.json`
        await DualWriteService.delete(eventKey)
      }

      // Clear sample progress for all teams
      const teams = this.getAvailableTeams()
      for (const teamName of teams) {
        const progressKey = `progress:BHHS:Vail:${teamName}`
        await DualWriteService.delete(progressKey)
      }

      console.log('✅ SeedService: All seeded data cleared')
    } catch (error) {
      console.error('❌ SeedService: Failed to clear seeded data:', error)
      throw error
    }
  }
}

// Export singleton instance for easy access
export const seedService = SeedService.getInstance()

// Default seed function for quick setup
export async function seedInitialData(options: SeedOptions = { skipExisting: true }) {
  return seedService.seedAppData(options)
}