import { ResolvedLocation } from './types';
import { config } from '../config';

const LOCATION_CACHE_KEY = 'vail-hunt-location-cache';

interface CachedLocation extends ResolvedLocation {
  cachedAt: number;
}

export function saveLocationToCache(location: ResolvedLocation): void {
  try {
    const cachedLocation: CachedLocation = {
      ...location,
      cachedAt: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cachedLocation));
  } catch (error) {
    console.warn('Failed to save location to cache:', error);
  }
}

export function loadLocationFromCache(): ResolvedLocation | null {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const cachedLocation: CachedLocation = JSON.parse(cached);
    const age = Date.now() - cachedLocation.cachedAt;
    
    if (age > config.LOCATION_CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      clearLocationCache();
      return null;
    }

    // Return cached location with updated source
    const { cachedAt, ...location } = cachedLocation;
    return {
      ...location,
      source: 'cache' as const,
    };
  } catch (error) {
    console.warn('Failed to load location from cache:', error);
    clearLocationCache();
    return null;
  }
}

export function clearLocationCache(): void {
  try {
    localStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear location cache:', error);
  }
}

export function isCacheValid(): boolean {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return false;

    const cachedLocation: CachedLocation = JSON.parse(cached);
    const age = Date.now() - cachedLocation.cachedAt;
    
    return age <= config.LOCATION_CACHE_EXPIRY_MS;
  } catch {
    return false;
  }
}