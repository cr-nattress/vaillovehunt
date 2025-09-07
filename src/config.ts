export const config = {
  // IP Geolocation fallback service
  VITE_IP_GEO_URL: import.meta.env.VITE_IP_GEO_URL || 'https://ipapi.co/json/',
  
  // Location services configuration
  LOCATION_CACHE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  LOCATION_DEFAULT_TIMEOUT: 8000, // 8 seconds
  
  // Existing configuration
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_FOLDER: import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'scavenger/entries',
  NETLIFY_BLOBS_STORE_NAME: import.meta.env.VITE_NETLIFY_BLOBS_STORE_NAME || 'vail-hunt-state',
} as const;