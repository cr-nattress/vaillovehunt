/**
 * Domain Service Layer - Phase 5 Business Logic
 * 
 * Central export barrel for all domain services that implement business logic
 * and orchestrate lower-level adapter-based services.
 */

// Core domain services
export * from './HuntDomainService'

// Re-export main domain service instance for convenience
export { huntDomainService as domainService } from './HuntDomainService'

// Domain service types
export type {
  HuntWithContext,
  HuntCreationResult,
  OrganizationAnalytics
} from './HuntDomainService'