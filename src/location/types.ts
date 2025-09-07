export interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export type LocationSource = 'geolocation' | 'cache' | 'ip';

export interface ResolvedLocation {
  coords: Coords;
  source: LocationSource;
  timestamp: number;
  zone?: {
    id: string;
    name: string;
  } | null;
  label?: string | null;
}

export interface LocationOptions {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
  useCache?: boolean;
}

export type ConsentLevel = 'precise' | 'coarse' | 'none';

export interface LocationConfig {
  ipGeoUrl?: string;
  cacheExpiryMs?: number;
  defaultTimeout?: number;
}