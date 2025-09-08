/**
 * Services Index - Phase 5 Complete Architecture
 * 
 * Central export for all services with migration compatibility layer.
 * Provides both legacy and V2 service access with gradual migration support.
 */

// V2 Services (Clean Architecture)
export * from './EventServiceV2'
export * from './OrgRegistryServiceV2'
export * from './domain'

// Legacy Services (for compatibility)
export * from './EventService'
export * from './OrgRegistryService'

// Migration Strategy
export * from './migration'

// Convenience exports for common usage patterns
export { eventServiceV2 as defaultEventService } from './EventServiceV2'
export { orgRegistryServiceV2 as defaultOrgRegistryService } from './OrgRegistryServiceV2'
export { huntDomainService as defaultDomainService } from './domain'

// Compatibility layer for existing consumers
export { CompatibilityLayer } from './migration'