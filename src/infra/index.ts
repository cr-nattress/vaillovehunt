/**
 * Infrastructure Index - Phase 4 Complete
 * 
 * Central export barrel for all adapter implementations with dependency injection.
 * Adapters implement the port interfaces using specific technologies.
 */

// HTTP Adapters
export * from './http/events.http.adapter'
export * from './http/orgs.http.adapter'

// Storage Adapters
export * from './storage/blob.adapter'
export * from './storage/kv.adapter'

// Media Adapters
export * from './media/cloudinary.adapter'

// Registry and dependency injection
export * from './registry'

// Convenience exports for commonly used adapters
export { BlobEventRepoAdapter, BlobOrgRepoAdapter } from './storage/blob.adapter'
export { CloudinaryMediaAdapter } from './media/cloudinary.adapter'

// Re-export ports for convenience
export * from '../ports'