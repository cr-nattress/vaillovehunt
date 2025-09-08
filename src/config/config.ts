/**
 * Application Configuration
 * 
 * Centralized configuration derived from environment variables with safe defaults.
 * This module provides typed access to all environment-derived configuration.
 */

/**
 * Environment configuration interface
 */
export interface AppConfig {
  // Cloudinary Configuration
  readonly cloudinary: {
    readonly cloudName: string
    readonly uploadFolder: string
  }
  
  // Netlify Configuration  
  readonly netlify: {
    readonly blobsStoreName: string
  }
  
  // Location Services Configuration
  readonly location: {
    readonly cacheExpiryMs: number
    readonly defaultTimeoutMs: number
    readonly ipGeoUrl: string
  }
  
  // API Configuration
  readonly api: {
    readonly baseUrl: string
    readonly timeout: number
  }
  
  // Development Configuration
  readonly dev: {
    readonly enableDebugLogs: boolean
    readonly enableMockData: boolean
  }
}

/**
 * Load configuration from environment variables with safe defaults
 */
function loadConfig(): AppConfig {
  return {
    cloudinary: {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      uploadFolder: import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'scavenger/entries'
    },
    
    netlify: {
      blobsStoreName: import.meta.env.VITE_NETLIFY_BLOBS_STORE_NAME || 'vail-hunt-state'
    },
    
    location: {
      cacheExpiryMs: 10 * 60 * 1000, // 10 minutes
      defaultTimeoutMs: 8000, // 8 seconds  
      ipGeoUrl: import.meta.env.VITE_IP_GEO_URL || 'https://ipapi.co/json/'
    },
    
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '',
      timeout: 30000 // 30 seconds
    },
    
    dev: {
      enableDebugLogs: import.meta.env.VITE_DEBUG_LOGS === 'true' || import.meta.env.DEV === true,
      enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || false
    }
  } as const
}

/**
 * Application configuration instance
 * 
 * This is the single source of truth for all configuration values.
 * Usage: import { config } from '@/config'
 */
export const config = loadConfig()

/**
 * Type-safe configuration access
 * 
 * Usage: 
 * ```ts
 * import { getConfig } from '@/config'
 * const cloudName = getConfig('cloudinary', 'cloudName')
 * ```
 */
export function getConfig<
  TSection extends keyof AppConfig,
  TKey extends keyof AppConfig[TSection]
>(section: TSection, key: TKey): AppConfig[TSection][TKey] {
  return config[section][key]
}

/**
 * Validate configuration
 * 
 * Throws if required configuration is missing or invalid
 */
export function validateConfig(): void {
  const required = [
    ['cloudinary.cloudName', config.cloudinary.cloudName],
    ['netlify.blobsStoreName', config.netlify.blobsStoreName]
  ] as const
  
  const missing = required.filter(([, value]) => !value)
  
  if (missing.length > 0) {
    const keys = missing.map(([key]) => key).join(', ')
    throw new Error(`Missing required configuration: ${keys}`)
  }
}