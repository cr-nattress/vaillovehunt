/**
 * Configuration Module
 * 
 * Centralized configuration and feature flags for the application.
 * This module provides typed access to environment variables and feature toggles.
 */

// Configuration exports
export { 
  config, 
  getConfig, 
  validateConfig,
  type AppConfig 
} from './config'

// Feature flags exports  
export { 
  flags, 
  getFlag, 
  hasAnyFlag, 
  getEnabledFlags,
  type FeatureFlags 
} from './flags'

// Convenience re-exports for backward compatibility
export const ENABLE_BLOB_EVENTS = () => getFlag('repository', 'enableBlobEvents')
export const ENABLE_KV_EVENTS = () => getFlag('repository', 'enableKvEvents')
export const ENABLE_VIDEO_UPLOAD = () => getFlag('media', 'enableVideoUpload')
export const ENABLE_REACT_QUERY = () => getFlag('ui', 'enableReactQuery')

// Re-export for migration from old config.ts
import { flags, getFlag } from './flags'

/** @deprecated Use flags.repository.enableBlobEvents instead */
export const LEGACY_ENABLE_BLOB_EVENTS = flags.repository.enableBlobEvents

/** @deprecated Use flags.repository.enableKvEvents instead */  
export const LEGACY_ENABLE_KV_EVENTS = flags.repository.enableKvEvents