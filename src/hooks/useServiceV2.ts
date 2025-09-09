/**
 * React Hooks for V2 Service Integration - Phase 6 Frontend Integration
 * 
 * Provides React-friendly wrappers around the V2 service layer with:
 * - Automatic loading states
 * - Error handling and retry logic
 * - Caching and invalidation
 * - Real-time data synchronization
 * - Migration compatibility
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  eventServiceV2, 
  orgRegistryServiceV2, 
  huntDomainService,
  serviceMigrationManager,
  MigrationPhase,
  CompatibilityLayer
} from '../services'
import type { 
  OrgEvent, 
  EventQueryOptions, 
  HealthStatus 
} from '../services/EventServiceV2'
import type { 
  CreateOrgRequest, 
  CreateHuntRequest, 
  ListOrgsOptions,
  OrganizationSummary
} from '../services/OrgRegistryServiceV2'
import type { 
  HuntWithContext, 
  HuntCreationResult, 
  OrganizationAnalytics 
} from '../services/domain'

// Hook state interfaces
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  lastUpdated: number
}

interface AsyncActions {
  refetch: () => Promise<void>
  reset: () => void
  invalidate: () => void
}

type UseAsyncResult<T> = AsyncState<T> & AsyncActions

// Cache configuration
interface CacheConfig {
  ttl: number // time to live in milliseconds
  staleWhileRevalidate?: boolean
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true
}

/**
 * Core hook for async data fetching with caching and error handling
 */
function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): UseAsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: 0
  })

  const isStale = useMemo(() => {
    return state.lastUpdated > 0 && 
           Date.now() - state.lastUpdated > config.ttl
  }, [state.lastUpdated, config.ttl])

  const fetchData = useCallback(async () => {
    // If we have fresh data and not forcing a refetch, return early
    if (state.data && !isStale && !state.loading) {
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await fetchFn()
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error('useAsyncData fetch error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }))
    }
  }, [fetchFn, isStale, state.data, state.loading])

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, lastUpdated: 0 }))
    await fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: 0
    })
  }, [])

  const invalidate = useCallback(() => {
    setState(prev => ({ ...prev, lastUpdated: 0 }))
  }, [])

  // Initial fetch and dependency updates
  useEffect(() => {
    fetchData()
  }, [...dependencies, fetchData])

  // Background revalidation for stale data
  useEffect(() => {
    if (config.staleWhileRevalidate && isStale && state.data) {
      fetchData()
    }
  }, [isStale, state.data, config.staleWhileRevalidate, fetchData])

  return {
    ...state,
    refetch,
    reset,
    invalidate
  }
}

/**
 * Hook for fetching today's events with caching
 */
export function useTodaysEvents(options: EventQueryOptions = {}) {
  return useAsyncData(
    () => eventServiceV2.fetchTodaysEvents(options),
    [JSON.stringify(options)],
    { ttl: 2 * 60 * 1000 } // 2 minutes for event data
  )
}

/**
 * Hook for fetching event details with organization context
 */
export function useEventDetails(orgSlug?: string, huntId?: string) {
  return useAsyncData(
    () => {
      if (!orgSlug || !huntId) {
        throw new Error('orgSlug and huntId are required')
      }
      return eventServiceV2.getEventDetails(orgSlug, huntId)
    },
    [orgSlug, huntId],
    { ttl: 10 * 60 * 1000 } // 10 minutes for detailed event data
  )
}

/**
 * Hook for organization registry operations
 */
export function useOrganization(orgSlug?: string) {
  const loadData = useCallback(async () => {
    if (!orgSlug) {
      throw new Error('orgSlug is required')
    }
    const result = await orgRegistryServiceV2.loadOrg(orgSlug)
    return result.data
  }, [orgSlug])

  return useAsyncData(
    loadData,
    [orgSlug],
    { ttl: 5 * 60 * 1000 } // 5 minutes for org data
  )
}

/**
 * Hook for organization listing with filtering
 */
export function useOrganizations(options: ListOrgsOptions = {}) {
  return useAsyncData(
    () => orgRegistryServiceV2.listOrganizations(options),
    [JSON.stringify(options)],
    { ttl: 10 * 60 * 1000 } // 10 minutes for org list
  )
}

/**
 * Hook for application configuration
 */
export function useAppConfig() {
  return useAsyncData(
    async () => {
      const result = await orgRegistryServiceV2.loadApp()
      return result.data
    },
    [],
    { ttl: 15 * 60 * 1000 } // 15 minutes for app config
  )
}

/**
 * Hook for hunt domain operations
 */
export function useHuntWithContext(orgSlug?: string, huntId?: string) {
  return useAsyncData(
    () => {
      if (!orgSlug || !huntId) {
        throw new Error('orgSlug and huntId are required')
      }
      return huntDomainService.getHuntWithContext(orgSlug, huntId)
    },
    [orgSlug, huntId],
    { ttl: 5 * 60 * 1000 }
  )
}

/**
 * Hook for organization analytics
 */
export function useOrganizationAnalytics(orgSlug?: string) {
  return useAsyncData(
    () => {
      if (!orgSlug) {
        throw new Error('orgSlug is required')
      }
      return huntDomainService.getOrganizationAnalytics(orgSlug)
    },
    [orgSlug],
    { ttl: 2 * 60 * 1000 } // 2 minutes for analytics (more frequent updates)
  )
}

/**
 * Hook for service health monitoring
 */
export function useServiceHealth(serviceName?: 'event' | 'org' | 'domain') {
  const fetchHealth = useCallback(async () => {
    if (!serviceName) {
      // Get all service health
      const [eventHealth, orgHealth, domainHealth] = await Promise.all([
        eventServiceV2.getHealthStatus(),
        orgRegistryServiceV2.getHealthStatus(),
        huntDomainService.getHealthStatus()
      ])
      
      return {
        event: eventHealth,
        org: orgHealth,
        domain: domainHealth,
        overall: [eventHealth, orgHealth, domainHealth].every(h => h.overall === 'healthy') ? 'healthy' : 'degraded'
      }
    }

    switch (serviceName) {
      case 'event':
        return eventServiceV2.getHealthStatus()
      case 'org':
        return orgRegistryServiceV2.getHealthStatus()
      case 'domain':
        return huntDomainService.getHealthStatus()
      default:
        throw new Error(`Unknown service: ${serviceName}`)
    }
  }, [serviceName])

  return useAsyncData(
    fetchHealth,
    [serviceName],
    { ttl: 30 * 1000 } // 30 seconds for health checks
  )
}

/**
 * Hook for migration status and management
 */
export function useMigrationStatus() {
  const [migrationStatus, setMigrationStatus] = useState(() => 
    serviceMigrationManager.getMigrationStatus()
  )

  const refreshStatus = useCallback(() => {
    const status = serviceMigrationManager.getMigrationStatus()
    setMigrationStatus(status)
  }, [])

  const setPhase = useCallback((phase: MigrationPhase) => {
    serviceMigrationManager.setMigrationPhase(phase)
    refreshStatus()
  }, [refreshStatus])

  const clearStats = useCallback(() => {
    serviceMigrationManager.clearStats()
    refreshStatus()
  }, [refreshStatus])

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [refreshStatus])

  return {
    status: migrationStatus,
    setPhase,
    clearStats,
    refresh: refreshStatus
  }
}

/**
 * Mutation hooks for data modification operations
 */

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  mutateAsync: (variables: TVariables) => Promise<TData>
  loading: boolean
  error: Error | null
  data: TData | null
  reset: () => void
}

function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const [state, setState] = useState<{
    data: TData | null
    loading: boolean
    error: Error | null
  }>({
    data: null,
    loading: false,
    error: null
  })

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setState({ data: null, loading: true, error: null })
    
    try {
      const data = await mutationFn(variables)
      setState({ data, loading: false, error: null })
      options.onSuccess?.(data, variables)
      options.onSettled?.(data, null, variables)
      return data
    } catch (error) {
      const err = error as Error
      setState(prev => ({ ...prev, loading: false, error: err }))
      options.onError?.(err, variables)
      options.onSettled?.(null, err, variables)
      throw err
    }
  }, [mutationFn, options])

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      return await mutateAsync(variables)
    } catch (error) {
      // Error already handled in mutateAsync
    }
  }, [mutateAsync])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    mutate: mutate as any, // Type assertion for void return
    mutateAsync,
    ...state,
    reset
  }
}

/**
 * Hook for creating organizations
 */
export function useCreateOrganization() {
  return useMutation(
    (request: CreateOrgRequest) => orgRegistryServiceV2.createOrganization(request)
  )
}

/**
 * Hook for creating hunts
 */
export function useCreateHunt() {
  return useMutation(
    ({ orgSlug, request }: { orgSlug: string; request: CreateHuntRequest }) =>
      orgRegistryServiceV2.createHunt(orgSlug, request)
  )
}

/**
 * Hook for complete hunt creation (domain service)
 */
export function useCreateCompleteHunt() {
  return useMutation(
    ({ orgSlug, huntRequest, orgRequest }: { 
      orgSlug: string; 
      huntRequest: CreateHuntRequest; 
      orgRequest?: CreateOrgRequest 
    }) =>
      huntDomainService.createCompleteHunt(orgSlug, huntRequest, orgRequest)
  )
}

/**
 * Hook for compatibility layer access (migration support)
 */
export function useCompatibilityLayer() {
  return useMemo(() => ({
    fetchTodaysEvents: CompatibilityLayer.fetchTodaysEvents,
    orgRegistryService: CompatibilityLayer.orgRegistryService,
    eventService: CompatibilityLayer.eventService
  }), [])
}

/**
 * Hook for cache management across all V2 services
 */
export function useServiceCache() {
  const clearEventCache = useCallback(() => {
    eventServiceV2.clearCache()
  }, [])

  const clearOrgCache = useCallback(() => {
    orgRegistryServiceV2.clearCache()
  }, [])

  const clearAllCaches = useCallback(() => {
    clearEventCache()
    clearOrgCache()
    // Domain service doesn't have direct cache, but clears its dependencies
  }, [clearEventCache, clearOrgCache])

  return {
    clearEventCache,
    clearOrgCache,
    clearAllCaches
  }
}