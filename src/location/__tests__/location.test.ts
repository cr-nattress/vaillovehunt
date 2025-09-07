import { describe, it, expect, beforeEach, vi } from 'vitest';
import { locate, setConsent, getConsent, clearLocation, getLastKnown } from '../index';

// Mock fetch for IP geolocation
global.fetch = vi.fn();

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Location Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setConsent('none'); // Reset consent
    // Clear localStorage for most tests (cache test will handle separately)
    localStorage.clear();
  });

  describe('Consent Management', () => {
    it('should start with no consent', () => {
      expect(getConsent()).toBe('none');
    });

    it('should allow setting consent level', () => {
      setConsent('precise');
      expect(getConsent()).toBe('precise');
      
      setConsent('coarse');
      expect(getConsent()).toBe('coarse');
      
      setConsent('none');
      expect(getConsent()).toBe('none');
    });
  });

  describe('IP Geolocation Fallback', () => {
    it('should fall back to IP geolocation when no consent', async () => {
      setConsent('none');
      
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          latitude: '39.6403',
          longitude: '-106.3742' // Vail, CO coordinates
        }),
      });

      const location = await locate();
      
      expect(location.source).toBe('ip');
      expect(location.coords.latitude).toBe(39.6403);
      expect(location.coords.longitude).toBe(-106.3742);
      expect(location.coords.accuracy).toBe(50000); // IP geolocation accuracy
    });

    it('should handle IP geolocation API errors', async () => {
      setConsent('none');
      
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(locate()).rejects.toThrow('All location methods failed');
    });
  });

  describe('Precise Geolocation', () => {
    it('should use geolocation API when consent is precise', async () => {
      setConsent('precise');
      
      const mockPosition = {
        coords: {
          latitude: 39.6403,
          longitude: -106.3742,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        success(mockPosition);
      });

      const location = await locate();
      
      expect(location.source).toBe('geolocation');
      expect(location.coords.latitude).toBe(39.6403);
      expect(location.coords.longitude).toBe(-106.3742);
      expect(location.coords.accuracy).toBe(10);
    });

    it('should fall back to IP when geolocation fails', async () => {
      setConsent('precise');
      
      // Mock geolocation failure
      mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied location access'
        });
      });

      // Mock successful IP geolocation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          latitude: '39.6403',
          longitude: '-106.3742'
        }),
      });

      const location = await locate();
      
      expect(location.source).toBe('ip');
    });
  });

  describe('Caching', () => {
    it('should cache location results in localStorage', async () => {
      // Don't clear localStorage for this specific test
      vi.clearAllMocks();
      setConsent('none');
      
      // Mock fetch to resolve every time
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: '39.6403',
          longitude: '-106.3742'
        }),
      });

      // First call - should make fetch request and cache result
      const location1 = await locate();
      expect(location1.source).toBe('ip');

      // Verify cache was saved
      const cachedData = localStorage.getItem('vail-hunt-location-cache');
      expect(cachedData).not.toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second call should use cache from localStorage instead of fetching
      const location2 = await locate();
      expect(location2.source).toBe('cache');
      expect(location2.coords.latitude).toBe(39.6403);
      expect(location2.coords.longitude).toBe(-106.3742);
      
      // Still only one fetch call should have been made
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Location', () => {
    it('should clear all location data', async () => {
      setConsent('none');
      
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          latitude: '39.6403',
          longitude: '-106.3742'
        }),
      });

      await locate();
      expect(getLastKnown()).not.toBeNull();

      clearLocation();
      expect(getLastKnown()).toBeNull();
    });
  });
});