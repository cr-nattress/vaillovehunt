import { Coords, ResolvedLocation, LocationOptions, ConsentLevel } from './types';
import { config } from '../config';
import { saveLocationToCache, loadLocationFromCache } from './cache';

let consentLevel: ConsentLevel = 'none';

export function setConsent(level: ConsentLevel): void {
  consentLevel = level;
}

export function getConsent(): ConsentLevel {
  return consentLevel;
}

export function getPreciseLocation(options?: LocationOptions): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    if (consentLevel === 'none') {
      reject(new Error('Location access denied by user consent'));
      return;
    }

    const timeout = options?.timeout ?? config.LOCATION_DEFAULT_TIMEOUT;
    const maximumAge = options?.maximumAge ?? 0;
    const enableHighAccuracy = options?.enableHighAccuracy ?? (consentLevel === 'precise');

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        const location: ResolvedLocation = {
          coords,
          source: 'geolocation',
          timestamp: position.timestamp || Date.now(),
        };

        resolve(location);
      },
      (error) => {
        let errorMessage = 'Failed to get precise location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      positionOptions
    );
  });
}

export async function getCoarseLocation(): Promise<ResolvedLocation> {
  try {
    const response = await fetch(config.VITE_IP_GEO_URL);
    if (!response.ok) {
      throw new Error(`IP geolocation request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.latitude || !data.longitude) {
      throw new Error('Invalid response from IP geolocation service');
    }

    const coords: Coords = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      // IP geolocation is typically much less accurate
      accuracy: 50000, // ~50km accuracy for IP geolocation
    };

    const location: ResolvedLocation = {
      coords,
      source: 'ip',
      timestamp: Date.now(),
    };

    return location;
  } catch (error) {
    throw new Error(`Failed to get coarse location: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserLocationSmart(options?: LocationOptions): Promise<ResolvedLocation> {
  // Check cache first if enabled (default to true)
  const useCache = options?.useCache !== false;
  if (useCache) {
    const cachedLocation = loadLocationFromCache();
    if (cachedLocation) {
      return cachedLocation;
    }
  }

  // Try precise location first if consent allows
  if (consentLevel === 'precise' || consentLevel === 'coarse') {
    try {
      const preciseLocation = await getPreciseLocation(options);
      // Save to cache for future use
      saveLocationToCache(preciseLocation);
      return preciseLocation;
    } catch (error) {
      console.warn('Precise location failed, falling back to IP geolocation:', error);
    }
  }

  // Fallback to IP geolocation if precise fails or not allowed
  try {
    const coarseLocation = await getCoarseLocation();
    // Save to cache for future use
    saveLocationToCache(coarseLocation);
    return coarseLocation;
  } catch (error) {
    throw new Error(`All location methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

let lastKnownLocation: ResolvedLocation | null = null;

export function getLastKnown(): ResolvedLocation | null {
  return lastKnownLocation || loadLocationFromCache();
}

export function setLastKnown(location: ResolvedLocation): void {
  lastKnownLocation = location;
}

export function clearLocation(): void {
  lastKnownLocation = null;
  // Clear cache is handled by the cache module
}