/**
 * Service Context - Phase 6 Frontend Integration
 * 
 * Provides React context for V2 services with:
 * - Centralized service access
 * - Configuration management
 * - Error boundaries integration
 * - Migration phase management
 * - Performance monitoring
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  eventServiceV2, 
  orgRegistryServiceV2, 
  huntDomainService,
  serviceMigrationManager,
  MigrationPhase,
  CompatibilityLayer
} from '../services'
import type { EventServiceV2 } from '../services/EventServiceV2'
import type { OrgRegistryServiceV2 } from '../services/OrgRegistryServiceV2'
import type { HuntDomainService } from '../services/domain/HuntDomainService'
import type { ServiceMigrationManager } from '../services/migration/ServiceMigrationGuide'

// Service context interface
interface ServiceContextValue {
  // V2 Services
  eventService: EventServiceV2
  orgService: OrgRegistryServiceV2  
  domainService: HuntDomainService
  
  // Migration management
  migrationManager: ServiceMigrationManager
  migrationPhase: MigrationPhase
  migrationStats: ReturnType<ServiceMigrationManager['getMigrationStatus']>
  
  // Compatibility layer
  compatibility: typeof CompatibilityLayer
  
  // Service management
  clearAllCaches: () => void
  refreshMigrationStats: () => void
  setMigrationPhase: (phase: MigrationPhase) => void
  
  // Health monitoring
  lastHealthCheck: number
  servicesHealthy: boolean
}

// Create context
const ServiceContext = createContext<ServiceContextValue | null>(null)

// Hook for accessing service context
export function useServices() {
  const context = useContext(ServiceContext)
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider')
  }
  return context
}

// Provider props
interface ServiceProviderProps {
  children: ReactNode
  initialMigrationPhase?: MigrationPhase
  enableHealthMonitoring?: boolean
  healthCheckInterval?: number
}

/**
 * Service Provider Component
 */
export function ServiceProvider({
  children,
  initialMigrationPhase = MigrationPhase.V2_WITH_FALLBACK,
  enableHealthMonitoring = true,
  healthCheckInterval = 30000 // 30 seconds
}: ServiceProviderProps) {
  const [migrationPhase, setMigrationPhaseState] = useState<MigrationPhase>(initialMigrationPhase)
  const [migrationStats, setMigrationStats] = useState(() => 
    serviceMigrationManager.getMigrationStatus()
  )
  const [lastHealthCheck, setLastHealthCheck] = useState<number>(Date.now())
  const [servicesHealthy, setServicesHealthy] = useState<boolean>(true)

  // Initialize migration phase
  useEffect(() => {
    serviceMigrationManager.setMigrationPhase(initialMigrationPhase)
    console.log('🔄 ServiceProvider: Initialized migration phase:', initialMigrationPhase)
  }, [initialMigrationPhase])

  // Refresh migration statistics
  const refreshMigrationStats = React.useCallback(() => {
    const stats = serviceMigrationManager.getMigrationStatus()
    setMigrationStats(stats)
    setMigrationPhaseState(stats.phase)
  }, [])

  // Set migration phase with state update
  const setMigrationPhase = React.useCallback((phase: MigrationPhase) => {
    serviceMigrationManager.setMigrationPhase(phase)
    refreshMigrationStats()
    console.log('🔄 ServiceProvider: Migration phase changed to:', phase)
  }, [refreshMigrationStats])

  // Clear all service caches
  const clearAllCaches = React.useCallback(() => {
    eventServiceV2.clearCache()
    orgRegistryServiceV2.clearCache()
    console.log('🧹 ServiceProvider: All service caches cleared')
  }, [])

  // Health monitoring
  useEffect(() => {
    if (!enableHealthMonitoring) return

    const checkHealth = async () => {
      try {
        const [eventHealth, orgHealth, domainHealth] = await Promise.all([
          eventServiceV2.getHealthStatus(),
          orgRegistryServiceV2.getHealthStatus(),
          huntDomainService.getHealthStatus()
        ])

        const allHealthy = [eventHealth, orgHealth, domainHealth]
          .every(health => health.overall === 'healthy')

        setServicesHealthy(allHealthy)
        setLastHealthCheck(Date.now())

        if (!allHealthy) {
          console.warn('⚠️ ServiceProvider: Some services are not healthy:', {
            event: eventHealth.overall,
            org: orgHealth.overall,
            domain: domainHealth.overall
          })
        }
      } catch (error) {
        console.error('❌ ServiceProvider: Health check failed:', error)
        setServicesHealthy(false)
        setLastHealthCheck(Date.now())
      }
    }

    // Initial health check
    checkHealth()

    // Periodic health checks
    const interval = setInterval(checkHealth, healthCheckInterval)
    return () => clearInterval(interval)
  }, [enableHealthMonitoring, healthCheckInterval])

  // Update migration stats periodically
  useEffect(() => {
    const interval = setInterval(refreshMigrationStats, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [refreshMigrationStats])

  const contextValue: ServiceContextValue = {
    // V2 Services
    eventService: eventServiceV2,
    orgService: orgRegistryServiceV2,
    domainService: huntDomainService,
    
    // Migration management
    migrationManager: serviceMigrationManager,
    migrationPhase,
    migrationStats,
    
    // Compatibility layer
    compatibility: CompatibilityLayer,
    
    // Service management
    clearAllCaches,
    refreshMigrationStats,
    setMigrationPhase,
    
    // Health monitoring
    lastHealthCheck,
    servicesHealthy
  }

  return (
    <ServiceContext.Provider value={contextValue}>
      {children}
    </ServiceContext.Provider>
  )
}

/**
 * Higher-order component for service access
 */
export function withServices<T extends {}>(Component: React.ComponentType<T & { services: ServiceContextValue }>) {
  return function WithServicesComponent(props: T) {
    const services = useServices()
    return <Component {...props} services={services} />
  }
}

/**
 * Hook for accessing specific services (convenience)
 */
export function useEventService() {
  const { eventService } = useServices()
  return eventService
}

export function useOrgService() {
  const { orgService } = useServices()
  return orgService
}

export function useDomainService() {
  const { domainService } = useServices()
  return domainService
}

export function useMigration() {
  const { 
    migrationManager, 
    migrationPhase, 
    migrationStats, 
    setMigrationPhase, 
    refreshMigrationStats 
  } = useServices()
  
  return {
    manager: migrationManager,
    phase: migrationPhase,
    stats: migrationStats,
    setPhase: setMigrationPhase,
    refresh: refreshMigrationStats
  }
}

export function useServiceHealth() {
  const { lastHealthCheck, servicesHealthy } = useServices()
  return { lastHealthCheck, healthy: servicesHealthy }
}