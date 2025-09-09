/**
 * Event Adapter Factory
 * 
 * Composition point that selects the appropriate EventRepoPort implementation
 * based on feature flags and configuration.
 */

import type { EventRepoPort } from '../ports/event.repo.port'
import { MockEventAdapter } from './http/events.mock.adapter'
import { BlobEventAdapter } from './storage/events.blob.adapter'
import { getFlag } from '../config/flags'

let _eventAdapter: EventRepoPort | null = null

/**
 * Get the configured event repository adapter
 * Singleton pattern ensures consistent adapter selection throughout the app
 */
export function getEventAdapter(): EventRepoPort {
  if (_eventAdapter) {
    return _eventAdapter
  }

  // Check feature flags to determine which adapter to use
  if (getFlag('repository', 'enableBlobEvents')) {
    console.log('🏗️ EventAdapterFactory: Using BlobEventAdapter (repository.enableBlobEvents=true)')
    _eventAdapter = new BlobEventAdapter()
  } else {
    console.log('🏗️ EventAdapterFactory: Using MockEventAdapter (repository.enableBlobEvents=false)')
    _eventAdapter = new MockEventAdapter()
  }

  return _eventAdapter
}

/**
 * Reset the adapter singleton (useful for testing)
 */
export function resetEventAdapter(): void {
  _eventAdapter = null
}

/**
 * Override the adapter for testing purposes
 */
export function setEventAdapter(adapter: EventRepoPort): void {
  _eventAdapter = adapter
}