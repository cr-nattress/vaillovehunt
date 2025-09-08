/**
 * Infrastructure Index
 * 
 * Central export barrel for all adapter implementations.
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