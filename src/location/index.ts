// Public API facade for location services
// This is the only file that should be imported by application code

import { 
  getUserLocationSmart, 
  getLastKnown as getLastKnownLocation, 
  setLastKnown,
  setConsent as setLocationConsent,
  getConsent as getLocationConsent,
  clearLocation as clearLocationData 
} from './location';
import { clearLocationCache } from './cache';
import type { 
  ResolvedLocation, 
  LocationOptions, 
  ConsentLevel, 
  LocationConfig 
} from './types';

// Global configuration
let locationConfig: LocationConfig = {};

// Initialize location services with optional configuration
export async function initLocation(config?: LocationConfig): Promise<void> {
  if (config) {
    locationConfig = { ...locationConfig, ...config };
  }
  // No async initialization needed for phase 1
}

// Get current location using smart fallback strategy
export async function locate(options?: LocationOptions): Promise<ResolvedLocation> {
  const location = await getUserLocationSmart(options);
  setLastKnown(location);
  return location;
}

// Get last known location from memory or cache
export function getLastKnown(): ResolvedLocation | null {
  return getLastKnownLocation();
}

// Get current zone (placeholder for future phases)
export function getZone(): { id: string; name: string } | null {
  return null; // Will be implemented in Phase 2
}

// Get human-readable location label (placeholder for future phases)
export function getLabel(): string | null {
  return null; // Will be implemented in Phase 3
}

// Clear all location data
export function clearLocation(): void {
  clearLocationData();
  clearLocationCache();
}

// Set user consent level for location access
export function setConsent(level: ConsentLevel): void {
  setLocationConsent(level);
}

// Get current user consent level
export function getConsent(): ConsentLevel {
  return getLocationConsent();
}

// Re-export types for consumers
export type {
  ResolvedLocation,
  LocationOptions,
  ConsentLevel,
  LocationConfig,
  Coords,
  LocationSource
} from './types';