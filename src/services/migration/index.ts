/**
 * Migration Strategy Index - Phase 5 Service Migration
 * 
 * Central export for migration utilities, compatibility layers,
 * and gradual rollout strategy for service layer refactoring.
 */

// Migration management
export * from './ServiceMigrationGuide'

// Re-export key migration utilities
export { 
  serviceMigrationManager,
  CompatibilityLayer,
  MigrationUtils,
  MigrationPhase 
} from './ServiceMigrationGuide'