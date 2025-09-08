/**
 * Adapter Registry - Phase 4 Implementation
 * 
 * Central registry for dependency injection and adapter management.
 * Provides type-safe access to infrastructure adapters with configuration.
 */

import { EventRepoPort } from '../ports/event.repo.port'
import { OrgRepoPort } from '../ports/org.repo.port'
import { MediaPort } from '../ports/media.port'
import { BlobEventRepoAdapter, BlobOrgRepoAdapter } from './storage/blob.adapter'
import { CloudinaryMediaAdapter } from './media/cloudinary.adapter'
import { getConfig, getFlags } from '../config'

/**
 * Registry configuration
 */
interface RegistryConfig {
  storageProvider: 'blob' | 'http' | 'mock'
  mediaProvider: 'cloudinary' | 'mock'
  eventProvider: 'blob' | 'http' | 'mock'
  enableCaching: boolean
  enableMetrics: boolean
}

/**
 * Adapter instances registry
 */
interface AdapterInstances {
  eventRepo?: EventRepoPort
  orgRepo?: OrgRepoPort
  media?: MediaPort
}

/**
 * Adapter factory functions
 */
interface AdapterFactories {
  eventRepo: Record<string, () => EventRepoPort>
  orgRepo: Record<string, () => OrgRepoPort>
  media: Record<string, () => MediaPort>
}

/**
 * Main adapter registry class
 */
export class AdapterRegistry {
  private static instance: AdapterRegistry
  private config: RegistryConfig
  private instances: AdapterInstances = {}
  private factories: AdapterFactories

  private constructor() {
    this.config = this.loadConfig()
    this.factories = this.createFactories()
    console.log('🔌 AdapterRegistry initialized:', {
      storageProvider: this.config.storageProvider,
      mediaProvider: this.config.mediaProvider,
      eventProvider: this.config.eventProvider,
      enableCaching: this.config.enableCaching
    })
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry()
    }
    return AdapterRegistry.instance
  }

  /**
   * Get event repository adapter
   */
  getEventRepo(): EventRepoPort {
    if (!this.instances.eventRepo) {
      const factory = this.factories.eventRepo[this.config.eventProvider]
      if (!factory) {
        throw new Error(`No factory found for event provider: ${this.config.eventProvider}`)
      }
      this.instances.eventRepo = factory()
      console.log(`✅ Created event repository adapter: ${this.config.eventProvider}`)
    }
    return this.instances.eventRepo
  }

  /**
   * Get organization repository adapter
   */
  getOrgRepo(): OrgRepoPort {
    if (!this.instances.orgRepo) {
      const factory = this.factories.orgRepo[this.config.storageProvider]
      if (!factory) {
        throw new Error(`No factory found for storage provider: ${this.config.storageProvider}`)
      }
      this.instances.orgRepo = factory()
      console.log(`✅ Created org repository adapter: ${this.config.storageProvider}`)
    }
    return this.instances.orgRepo
  }

  /**
   * Get media adapter
   */
  getMedia(): MediaPort {
    if (!this.instances.media) {
      const factory = this.factories.media[this.config.mediaProvider]
      if (!factory) {
        throw new Error(`No factory found for media provider: ${this.config.mediaProvider}`)
      }
      this.instances.media = factory()
      console.log(`✅ Created media adapter: ${this.config.mediaProvider}`)
    }
    return this.instances.media
  }

  /**
   * Reset all instances (useful for testing)
   */
  reset(): void {
    this.instances = {}
    console.log('🔄 AdapterRegistry reset')
  }

  /**
   * Get current configuration
   */
  getConfig(): RegistryConfig {
    return { ...this.config }
  }

  /**
   * Override configuration (useful for testing)
   */
  setConfig(config: Partial<RegistryConfig>): void {
    this.config = { ...this.config, ...config }
    this.reset() // Reset instances to pick up new config
    console.log('⚙️ AdapterRegistry config updated:', this.config)
  }

  /**
   * Load configuration from environment and feature flags
   */
  private loadConfig(): RegistryConfig {
    const config = getConfig()
    const flags = getFlags()

    return {
      storageProvider: flags.repository.enableBlobEvents ? 'blob' : 'mock',
      mediaProvider: flags.media.enableVideoUpload ? 'cloudinary' : 'mock',
      eventProvider: flags.repository.enableBlobEvents ? 'blob' : 'mock',
      enableCaching: config.performance.enableCaching,
      enableMetrics: config.monitoring.enableMetrics
    }
  }

  /**
   * Create adapter factory functions
   */
  private createFactories(): AdapterFactories {
    return {
      eventRepo: {
        blob: () => new BlobEventRepoAdapter(),
        http: () => {
          throw new Error('HTTP event repository adapter not yet implemented')
        },
        mock: () => new MockEventRepoAdapter()
      },
      orgRepo: {
        blob: () => new BlobOrgRepoAdapter(),
        http: () => {
          throw new Error('HTTP org repository adapter not yet implemented')
        },
        mock: () => new MockOrgRepoAdapter()
      },
      media: {
        cloudinary: () => new CloudinaryMediaAdapter(),
        mock: () => new MockMediaAdapter()
      }
    }
  }
}

/**
 * Mock implementations for testing and development
 */
class MockEventRepoAdapter implements EventRepoPort {
  async listToday() { return [] }
  async getEvent() { throw new Error('Mock: Event not found') }
  async upsertEvent() { return { data: null as any, etag: 'mock' } }
}

class MockOrgRepoAdapter implements OrgRepoPort {
  async getApp() { return { data: null as any, etag: 'mock' } }
  async getOrg() { return { data: null as any, etag: 'mock' } }
  async listOrgs() { return [] }
  async upsertOrg() { return 'mock' }
  async upsertApp() { return 'mock' }
}

class MockMediaAdapter implements MediaPort {
  async uploadImage() { 
    return { 
      mediaType: 'image' as const, 
      publicId: 'mock', 
      url: 'https://via.placeholder.com/300',
      createdAt: new Date().toISOString()
    } 
  }
  async uploadVideo() { 
    return { 
      mediaType: 'video' as const, 
      publicId: 'mock', 
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      createdAt: new Date().toISOString()
    } 
  }
  async deleteMedia() { return }
}

/**
 * Convenience functions for accessing adapters
 */
export const getEventRepo = (): EventRepoPort => AdapterRegistry.getInstance().getEventRepo()
export const getOrgRepo = (): OrgRepoPort => AdapterRegistry.getInstance().getOrgRepo()
export const getMedia = (): MediaPort => AdapterRegistry.getInstance().getMedia()

/**
 * Configuration management
 */
export const getAdapterConfig = () => AdapterRegistry.getInstance().getConfig()
export const setAdapterConfig = (config: Partial<RegistryConfig>) => AdapterRegistry.getInstance().setConfig(config)
export const resetAdapters = () => AdapterRegistry.getInstance().reset()

/**
 * Registry status for debugging
 */
export function getRegistryStatus() {
  const registry = AdapterRegistry.getInstance()
  const config = registry.getConfig()
  
  return {
    config,
    adapters: {
      eventRepo: config.eventProvider,
      orgRepo: config.storageProvider,
      media: config.mediaProvider
    },
    features: {
      caching: config.enableCaching,
      metrics: config.enableMetrics
    }
  }
}