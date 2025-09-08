/**
 * Service Migration Guide - Phase 5 Migration Strategy
 * 
 * Provides migration path and compatibility layers for transitioning
 * from legacy services to the new clean architecture implementation.
 */

import { EventServiceV2, eventServiceV2, type OrgEvent } from '../EventServiceV2'
import { OrgRegistryServiceV2, orgRegistryServiceV2 } from '../OrgRegistryServiceV2'
import { huntDomainService } from '../domain'
import { fetchTodaysEvents as legacyFetchTodaysEvents } from '../EventService'
import { orgRegistryService as legacyOrgRegistryService } from '../OrgRegistryService'

/**
 * Migration phases for gradual rollout
 */
export enum MigrationPhase {
  /** Legacy services only */
  LEGACY_ONLY = 'legacy-only',
  
  /** V2 services available, legacy fallback */
  V2_WITH_FALLBACK = 'v2-with-fallback',
  
  /** V2 services primary, legacy for compatibility */
  V2_PRIMARY = 'v2-primary',
  
  /** V2 services only, no legacy fallback */
  V2_ONLY = 'v2-only'
}

/**
 * Migration configuration
 */
interface MigrationConfig {
  phase: MigrationPhase
  enableFallback: boolean
  logMigrationUsage: boolean
  errorOnLegacyAccess: boolean
}

/**
 * Service Migration Manager
 */
export class ServiceMigrationManager {
  private config: MigrationConfig
  private usageStats: Map<string, { legacy: number; v2: number }> = new Map()

  constructor(config?: Partial<MigrationConfig>) {
    this.config = {
      phase: MigrationPhase.V2_WITH_FALLBACK,
      enableFallback: true,
      logMigrationUsage: true,
      errorOnLegacyAccess: false,
      ...config
    }

    console.log('🔄 ServiceMigrationManager initialized:', this.config)
  }

  /**
   * Get EventService instance based on migration phase
   */
  getEventService(): EventServiceV2 {
    this.recordUsage('eventService', 'v2')
    return eventServiceV2
  }

  /**
   * Get OrgRegistryService instance based on migration phase
   */
  getOrgRegistryService(): OrgRegistryServiceV2 {
    this.recordUsage('orgRegistryService', 'v2')
    return orgRegistryServiceV2
  }

  /**
   * Get HuntDomainService (new service only)
   */
  getHuntDomainService() {
    this.recordUsage('huntDomainService', 'v2')
    return huntDomainService
  }

  /**
   * Compatibility wrapper for fetchTodaysEvents
   */
  async fetchTodaysEvents(baseUrl: string = ''): Promise<OrgEvent[]> {
    try {
      if (this.config.phase === MigrationPhase.LEGACY_ONLY) {
        this.recordUsage('fetchTodaysEvents', 'legacy')
        return await legacyFetchTodaysEvents(baseUrl)
      }

      // Try V2 first in all other phases
      this.recordUsage('fetchTodaysEvents', 'v2')
      const v2Result = await eventServiceV2.fetchTodaysEvents()
      
      if (this.config.logMigrationUsage) {
        console.log(`✅ ServiceMigration: fetchTodaysEvents using V2 service, returned ${v2Result.length} events`)
      }
      
      return v2Result

    } catch (error) {
      console.error('❌ ServiceMigration: V2 fetchTodaysEvents failed:', error)

      if (this.config.enableFallback && this.config.phase !== MigrationPhase.V2_ONLY) {
        console.log('🔄 ServiceMigration: Falling back to legacy fetchTodaysEvents')
        this.recordUsage('fetchTodaysEvents', 'legacy')
        return await legacyFetchTodaysEvents(baseUrl)
      }

      throw error
    }
  }

  /**
   * Migration status check
   */
  getMigrationStatus() {
    const totalCalls = Array.from(this.usageStats.values()).reduce(
      (total, stats) => total + stats.legacy + stats.v2,
      0
    )

    const v2Usage = Array.from(this.usageStats.values()).reduce(
      (total, stats) => total + stats.v2,
      0
    )

    return {
      phase: this.config.phase,
      config: this.config,
      usage: Object.fromEntries(this.usageStats),
      summary: {
        totalCalls,
        v2Usage,
        legacyUsage: totalCalls - v2Usage,
        v2Percentage: totalCalls > 0 ? Math.round((v2Usage / totalCalls) * 100) : 0
      },
      recommendations: this.getRecommendations()
    }
  }

  /**
   * Set migration phase
   */
  setMigrationPhase(phase: MigrationPhase): void {
    console.log(`🔄 ServiceMigration: Changing phase from ${this.config.phase} to ${phase}`)
    this.config.phase = phase
    
    // Update other config based on phase
    switch (phase) {
      case MigrationPhase.LEGACY_ONLY:
        this.config.enableFallback = false
        this.config.errorOnLegacyAccess = false
        break
      case MigrationPhase.V2_WITH_FALLBACK:
        this.config.enableFallback = true
        this.config.errorOnLegacyAccess = false
        break
      case MigrationPhase.V2_PRIMARY:
        this.config.enableFallback = true
        this.config.errorOnLegacyAccess = true
        break
      case MigrationPhase.V2_ONLY:
        this.config.enableFallback = false
        this.config.errorOnLegacyAccess = true
        break
    }
  }

  /**
   * Clear usage statistics
   */
  clearStats(): void {
    this.usageStats.clear()
    console.log('📊 ServiceMigration: Usage statistics cleared')
  }

  /**
   * Helper: Record service usage
   */
  private recordUsage(service: string, version: 'legacy' | 'v2'): void {
    if (!this.usageStats.has(service)) {
      this.usageStats.set(service, { legacy: 0, v2: 0 })
    }
    
    const stats = this.usageStats.get(service)!
    stats[version]++
  }

  /**
   * Helper: Generate migration recommendations
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = []
    const status = {
      totalCalls: Array.from(this.usageStats.values()).reduce((total, stats) => total + stats.legacy + stats.v2, 0),
      v2Usage: Array.from(this.usageStats.values()).reduce((total, stats) => total + stats.v2, 0)
    }

    if (status.totalCalls === 0) {
      recommendations.push('No service usage recorded yet')
      return recommendations
    }

    const v2Percentage = (status.v2Usage / status.totalCalls) * 100

    switch (this.config.phase) {
      case MigrationPhase.LEGACY_ONLY:
        recommendations.push('Consider upgrading to V2_WITH_FALLBACK phase to start using V2 services')
        break
      
      case MigrationPhase.V2_WITH_FALLBACK:
        if (v2Percentage > 90) {
          recommendations.push('High V2 usage detected. Consider upgrading to V2_PRIMARY phase')
        } else if (v2Percentage < 50) {
          recommendations.push('Low V2 usage. Check for errors or compatibility issues')
        }
        break
      
      case MigrationPhase.V2_PRIMARY:
        if (v2Percentage > 95) {
          recommendations.push('Excellent V2 usage. Consider upgrading to V2_ONLY phase')
        }
        if (status.totalCalls - status.v2Usage > 10) {
          recommendations.push('Still seeing legacy service usage. Investigate remaining dependencies')
        }
        break
      
      case MigrationPhase.V2_ONLY:
        if (status.totalCalls - status.v2Usage > 0) {
          recommendations.push('WARNING: Legacy service calls detected in V2_ONLY phase')
        } else {
          recommendations.push('Migration complete! All services using V2 architecture')
        }
        break
    }

    return recommendations
  }
}

/**
 * Global migration manager instance
 */
export const serviceMigrationManager = new ServiceMigrationManager()

/**
 * Compatibility wrappers for existing code
 */
export const CompatibilityLayer = {
  /**
   * Legacy fetchTodaysEvents function - forwards to migration manager
   */
  async fetchTodaysEvents(baseUrl: string = ''): Promise<OrgEvent[]> {
    return serviceMigrationManager.fetchTodaysEvents(baseUrl)
  },

  /**
   * Legacy orgRegistryService getter - returns V2 instance
   */
  get orgRegistryService() {
    return serviceMigrationManager.getOrgRegistryService()
  },

  /**
   * Legacy eventService getter - returns V2 instance  
   */
  get eventService() {
    return serviceMigrationManager.getEventService()
  }
}

/**
 * Migration utility functions
 */
export const MigrationUtils = {
  /**
   * Check if service is ready for next migration phase
   */
  isReadyForNextPhase(): boolean {
    const status = serviceMigrationManager.getMigrationStatus()
    return status.summary.v2Percentage > 95
  },

  /**
   * Get detailed migration report
   */
  getMigrationReport() {
    return serviceMigrationManager.getMigrationStatus()
  },

  /**
   * Advance to next migration phase if ready
   */
  advancePhaseIfReady(): { advanced: boolean; newPhase?: MigrationPhase; reason: string } {
    const currentPhase = serviceMigrationManager.getMigrationStatus().phase
    
    if (!this.isReadyForNextPhase()) {
      return { 
        advanced: false, 
        reason: 'V2 service usage below 95% threshold' 
      }
    }

    let nextPhase: MigrationPhase | null = null

    switch (currentPhase) {
      case MigrationPhase.LEGACY_ONLY:
        nextPhase = MigrationPhase.V2_WITH_FALLBACK
        break
      case MigrationPhase.V2_WITH_FALLBACK:
        nextPhase = MigrationPhase.V2_PRIMARY
        break
      case MigrationPhase.V2_PRIMARY:
        nextPhase = MigrationPhase.V2_ONLY
        break
      case MigrationPhase.V2_ONLY:
        return { 
          advanced: false, 
          reason: 'Already at final migration phase' 
        }
    }

    if (nextPhase) {
      serviceMigrationManager.setMigrationPhase(nextPhase)
      return { 
        advanced: true, 
        newPhase: nextPhase, 
        reason: 'Successfully advanced to next phase' 
      }
    }

    return { 
      advanced: false, 
      reason: 'Unable to determine next phase' 
    }
  }
}