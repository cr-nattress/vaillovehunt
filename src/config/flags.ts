/**
 * Feature Flags
 * 
 * Centralized feature flag management for gradual rollouts and A/B testing.
 * Each flag includes documentation about its purpose and rollout strategy.
 */

/**
 * Feature flags interface with typed values
 */
export interface FeatureFlags {
  // Repository Layer Flags
  readonly repository: {
    /** Enable blob storage for event data (replaces mock data) */
    readonly enableBlobEvents: boolean
    /** Enable KV storage for session/cache data */
    readonly enableKvEvents: boolean  
    /** Use HTTP adapters instead of direct service calls */
    readonly useHttpRepo: boolean
    /** Enable optimistic concurrency control with ETags */
    readonly enableEtagConcurrency: boolean
  }
  
  // Media & Upload Flags
  readonly media: {
    /** Enable video upload functionality */
    readonly enableVideoUpload: boolean
    /** Use server-signed uploads instead of direct client uploads */
    readonly useSignedUploads: boolean
    /** Enable media compression and transformation */
    readonly enableMediaProcessing: boolean
  }
  
  // UI/UX Feature Flags
  readonly ui: {
    /** Enable React Query for server state management */
    readonly enableReactQuery: boolean
    /** Enable new wizard form flow with RHF + Zod */
    readonly enableNewWizardForms: boolean
    /** Enable offline mode with draft autosave */
    readonly enableOfflineMode: boolean
    /** Enable dark mode theme support */
    readonly enableDarkMode: boolean
  }
  
  // Location & Geo Flags
  readonly geo: {
    /** Enable browser geolocation services */
    readonly enableBrowserGeo: boolean
    /** Enable IP-based geolocation fallback */
    readonly enableIpGeo: boolean
    /** Enable location-based notifications */
    readonly enableLocationNotifications: boolean
  }
  
  // Analytics & Observability  
  readonly observability: {
    /** Enable performance monitoring */
    readonly enablePerformanceMonitoring: boolean
    /** Enable error tracking and reporting */
    readonly enableErrorTracking: boolean
    /** Enable debug logging in production */
    readonly enableDebugLogs: boolean
    /** Enable audit trail logging */
    readonly enableAuditLogs: boolean
  }
  
  // Experimental Features
  readonly experimental: {
    /** Enable new event creation flow */
    readonly enableNewEventFlow: boolean
    /** Enable team collaboration features */
    readonly enableTeamCollaboration: boolean
    /** Enable AI-powered hint generation */
    readonly enableAiHints: boolean
  }
}

/**
 * Load feature flags from environment with rollout strategy
 */
function loadFeatureFlags(): FeatureFlags {
  return {
    repository: {
      // Phase 4: Enable blob storage for events (default: false, gradual rollout)
      enableBlobEvents: import.meta.env.VITE_ENABLE_BLOB_EVENTS === 'true' || false,
      
      // Phase 4: Enable KV storage for sessions/cache (default: false, after blob events stable)  
      enableKvEvents: import.meta.env.VITE_ENABLE_KV_EVENTS === 'true' || false,
      
      // Phase 4: Use HTTP adapters for repo operations (default: false, for testing)
      useHttpRepo: import.meta.env.VITE_USE_HTTP_REPO === 'true' || false,
      
      // Phase 8: Enable ETag-based optimistic concurrency (default: false, needs infrastructure)
      enableEtagConcurrency: import.meta.env.VITE_ENABLE_ETAG_CONCURRENCY === 'true' || false
    },
    
    media: {
      // Phase 9: Video uploads (default: true, recently implemented)
      enableVideoUpload: import.meta.env.VITE_ENABLE_VIDEO_UPLOAD !== 'false', // default true
      
      // Phase 9: Server-signed uploads (default: false, needs security review)
      useSignedUploads: import.meta.env.VITE_USE_SIGNED_UPLOADS === 'true' || false,
      
      // Phase 9: Media processing/compression (default: true for images, false for videos)
      enableMediaProcessing: import.meta.env.VITE_ENABLE_MEDIA_PROCESSING !== 'false'
    },
    
    ui: {
      // Phase 5: React Query for server state (default: false, major architectural change)
      enableReactQuery: import.meta.env.VITE_ENABLE_REACT_QUERY === 'true' || false,
      
      // Phase 6: New wizard forms with RHF + Zod (default: false, UX testing needed)
      enableNewWizardForms: import.meta.env.VITE_ENABLE_NEW_WIZARD_FORMS === 'true' || false,
      
      // Phase 6: Offline mode with draft autosave (default: false, needs IndexedDB)
      enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true' || false,
      
      // Future: Dark mode support (default: false, design system not ready)
      enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true' || false
    },
    
    geo: {
      // Current: Browser geolocation (default: true, well tested)
      enableBrowserGeo: import.meta.env.VITE_ENABLE_BROWSER_GEO !== 'false',
      
      // Current: IP geolocation fallback (default: true, privacy-friendly fallback)
      enableIpGeo: import.meta.env.VITE_ENABLE_IP_GEO !== 'false',
      
      // Future: Location notifications (default: false, needs notification permissions)
      enableLocationNotifications: import.meta.env.VITE_ENABLE_LOCATION_NOTIFICATIONS === 'true' || false
    },
    
    observability: {
      // Phase 10: Performance monitoring (default: false, needs analytics provider)
      enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' || false,
      
      // Phase 10: Error tracking (default: false, needs Sentry/similar setup)
      enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true' || false,
      
      // Development: Debug logging (default: true in dev, false in prod)
      enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || import.meta.env.DEV === true,
      
      // Phase 10: Audit trail logging (default: false, needs compliance review)
      enableAuditLogs: import.meta.env.VITE_ENABLE_AUDIT_LOGS === 'true' || false
    },
    
    experimental: {
      // Phase 6+: New event creation flow (default: false, major UX change)
      enableNewEventFlow: import.meta.env.VITE_ENABLE_NEW_EVENT_FLOW === 'true' || false,
      
      // Future: Team collaboration (default: false, needs real-time infrastructure)
      enableTeamCollaboration: import.meta.env.VITE_ENABLE_TEAM_COLLABORATION === 'true' || false,
      
      // Future: AI-powered hints (default: false, needs AI provider integration)
      enableAiHints: import.meta.env.VITE_ENABLE_AI_HINTS === 'true' || false
    }
  } as const
}

/**
 * Feature flags instance
 * 
 * Usage: import { flags } from '@/config'
 */
export const flags = loadFeatureFlags()

/**
 * Type-safe flag access utility
 * 
 * Usage:
 * ```ts
 * import { getFlag } from '@/config' 
 * const isEnabled = getFlag('repository', 'enableBlobEvents')
 * ```
 */
export function getFlag<
  TSection extends keyof FeatureFlags,
  TKey extends keyof FeatureFlags[TSection]
>(section: TSection, key: TKey): FeatureFlags[TSection][TKey] {
  return flags[section][key]
}

/**
 * Check if any flags in a section are enabled
 * 
 * Usage:
 * ```ts
 * const hasExperimentalFeatures = hasAnyFlag('experimental')
 * ```
 */
export function hasAnyFlag(section: keyof FeatureFlags): boolean {
  const sectionFlags = flags[section]
  return Object.values(sectionFlags).some(Boolean)
}

/**
 * Get all enabled flags for debugging
 */
export function getEnabledFlags(): Record<string, boolean> {
  const enabled: Record<string, boolean> = {}
  
  for (const [section, sectionFlags] of Object.entries(flags)) {
    for (const [key, value] of Object.entries(sectionFlags)) {
      if (value) {
        enabled[`${section}.${key}`] = true
      }
    }
  }
  
  return enabled
}