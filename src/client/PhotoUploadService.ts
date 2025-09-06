import { apiClient } from '../services/apiClient'
import { 
  UploadResponseSchema,
  PhotoRecordSchema,
  validateSchema,
  type UploadResponse,
  type PhotoRecord
} from '../types/schemas'

// Re-export types for backward compatibility
export type PhotoUploadResponse = UploadResponse
export type { PhotoRecord }

export class PhotoUploadService {
  
  /**
   * Upload a single photo for a specific location
   * @param file The image file to upload
   * @param locationTitle The title of the location
   * @param sessionId The current session ID
   * @param teamName The team name for tagging (optional)
   * @param locationName The location name for tagging (optional, e.g., 'Vail Village', 'BHHS')
   * @param eventName The event name for tagging (optional)
   * @returns Promise resolving to photo upload response
   */
  static async uploadPhoto(
    file: File, 
    locationTitle: string, 
    sessionId: string,
    teamName?: string,
    locationName?: string,
    eventName?: string
  ): Promise<PhotoUploadResponse> {
    console.log('📸 PhotoUploadService.uploadPhoto() called');
    console.log('  File:', { name: file.name, size: file.size, type: file.type });
    console.log('  Location:', locationTitle);
    console.log('  Session:', sessionId);
    console.log('  Team:', teamName);
    console.log('  Location Name:', locationName);
    console.log('  Event Name:', eventName);
    
    // Validate inputs
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (!locationTitle) {
      throw new Error('Location title is required');
    }
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    console.log('✅ Input validation passed');
    
    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('locationTitle', locationTitle);
    formData.append('sessionId', sessionId);
    if (teamName) formData.append('teamName', teamName);
    if (locationName) formData.append('locationName', locationName);
    if (eventName) formData.append('eventName', eventName);
    
    console.log('📦 FormData created with metadata');
    
    try {
      console.log('🌐 Making API request via apiClient...');
      
      const rawResponse = await apiClient.requestFormData<unknown>('/photo-upload', formData, {
        timeout: 60000, // 60 second timeout for file uploads
        retryAttempts: 2
      });
      
      // Validate response with schema
      const response = validateSchema(UploadResponseSchema, rawResponse, 'photo upload');
      
      console.log('📊 Upload successful:', response);
      
      return response;
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload a photo with automatic resizing for better performance
   * @param file The image file to upload
   * @param locationTitle The title of the location
   * @param sessionId The current session ID
   * @param maxWidth Maximum width for resizing (default: 1600)
   * @param quality Image quality (default: 0.8)
   * @param teamName The team name for tagging (optional)
   * @param locationName The location name for tagging (optional, e.g., 'Vail Village', 'BHHS')
   * @param eventName The event name for tagging (optional)
   * @returns Promise resolving to photo upload response
   */
  static async uploadPhotoWithResize(
    file: File,
    locationTitle: string,
    sessionId: string,
    maxWidth = 1600,
    quality = 0.8,
    teamName?: string,
    locationName?: string,
    eventName?: string
  ): Promise<PhotoUploadResponse> {
    console.log('🔄 Resizing image before upload...');
    
    const resizedFile = await this.resizeImage(file, maxWidth, quality);
    console.log(`📏 Resized: ${file.size} → ${resizedFile.size} bytes`);
    
    return this.uploadPhoto(resizedFile, locationTitle, sessionId, teamName, locationName, eventName);
  }
  
  /**
   * Check if a location already has a photo uploaded by the team
   * @param locationId The location ID to check
   * @param teamName The team name
   * @param locationName The location name (for namespace)
   * @param eventName The event name (for namespace)
   * @returns Promise resolving to existing photo record or null
   */
  static async getExistingPhoto(
    locationId: string, 
    teamName: string,
    locationName?: string,
    eventName?: string
  ): Promise<PhotoRecord | null> {
    try {
      console.log(`🔍 GET EXISTING PHOTO: locationId=${locationId}, team=${teamName}, location=${locationName}, event=${eventName}`)
      
      // Get team photos from storage
      const teamPhotos = await this.getTeamPhotos(teamName, locationName, eventName);
      console.log(`📊 Retrieved ${teamPhotos.length} team photos:`, teamPhotos)
      
      // Find photo for this location
      const existingPhoto = teamPhotos.find(photo => photo.locationId === locationId);
      console.log(`🔍 Found existing photo for ${locationId}:`, existingPhoto)
      
      return existingPhoto || null;
      
    } catch (error) {
      console.warn('Failed to check existing photo:', error);
      return null;
    }
  }
  
  /**
   * Save photo record to team storage (shared among team members)
   * @param photoResponse The photo upload response
   * @param locationId The location ID
   * @param teamName The team name
   * @param locationName The location name (for namespace)
   * @param eventName The event name (for namespace)
   */
  static async savePhotoRecord(
    photoResponse: PhotoUploadResponse,
    locationId: string,
    teamName: string,
    locationName?: string,
    eventName?: string
  ): Promise<void> {
    try {
      console.log(`🔄 SAVE PHOTO RECORD: locationId=${locationId}, team=${teamName}, location=${locationName}, event=${eventName}`)
      
      const photoRecord: PhotoRecord = {
        ...photoResponse,
        locationId
      };
      console.log(`📸 Photo record created:`, photoRecord)
      
      // Get existing team photos
      console.log(`🔍 Getting existing team photos...`)
      const teamPhotos = await this.getTeamPhotos(teamName, locationName, eventName);
      console.log(`📊 Found ${teamPhotos.length} existing photos:`, teamPhotos)
      
      // Remove any existing photo for this location (replace)
      const existingCount = teamPhotos.length;
      const updatedPhotos = teamPhotos.filter(photo => photo.locationId !== locationId);
      const removedCount = existingCount - updatedPhotos.length;
      console.log(`🗑️ Removed ${removedCount} existing photos for location ${locationId}`)
      
      updatedPhotos.push(photoRecord);
      console.log(`➕ Added new photo record. Total photos: ${updatedPhotos.length}`)
      console.log(`📋 Final photos array:`, updatedPhotos)
      
      // Save back to team storage
      console.log(`💾 Saving to team storage...`)
      await this.saveTeamPhotos(teamName, updatedPhotos, locationName, eventName);
      
      console.log(`✅ Photo record saved for location ${locationId} (team: ${teamName})`);
      
    } catch (error) {
      console.error('💥 Failed to save photo record:', error);
      throw error;
    }
  }

  /**
   * Save photos for a team (shared among team members)
   * @param teamName The team name
   * @param photos Array of photo records
   * @param locationName The location name (for namespace)
   * @param eventName The event name (for namespace)
   */
  private static async saveTeamPhotos(
    teamName: string,
    photos: PhotoRecord[],
    locationName?: string,
    eventName?: string
  ): Promise<void> {
    try {
      // Create team-specific key
      const namespaced = locationName && eventName 
        ? `${locationName}-${eventName}-${teamName}`
        : teamName;
      const key = `team-photos:${namespaced}`;
      
      console.log(`🔑 SAVE TEAM PHOTOS: key=${key}`)
      console.log(`📊 Saving ${photos.length} photos:`, photos)
      
      localStorage.setItem(key, JSON.stringify(photos));
      
      // Verify save
      const saved = localStorage.getItem(key);
      const parsedSaved = saved ? JSON.parse(saved) : null;
      console.log(`✅ Verification: ${parsedSaved?.length || 0} photos saved to localStorage`)
      
    } catch (error) {
      console.error('💥 Failed to save team photos:', error);
      throw error;
    }
  }
  
  /**
   * Get all photos for a team
   * @param teamName The team name
   * @param locationName The location name (for namespace)
   * @param eventName The event name (for namespace)
   * @returns Promise resolving to array of photo records
   */
  static async getTeamPhotos(teamName: string, locationName?: string, eventName?: string): Promise<PhotoRecord[]> {
    try {
      // Create team-specific key
      const namespaced = locationName && eventName 
        ? `${locationName}-${eventName}-${teamName}`
        : teamName;
      const key = `team-photos:${namespaced}`;
      
      console.log(`🔑 GET TEAM PHOTOS: key=${key}`)
      console.log(`🔑 Team parameters: teamName=${teamName}, locationName=${locationName}, eventName=${eventName}`)
      
      const stored = localStorage.getItem(key);
      console.log(`🗄️ Raw stored data:`, stored ? `${stored.length} chars` : 'null')
      
      // Debug: Show all team-photos keys in localStorage to verify isolation
      console.log(`🔍 All team-photos keys in localStorage:`)
      for (let i = 0; i < localStorage.length; i++) {
        const debugKey = localStorage.key(i)
        if (debugKey && debugKey.startsWith('team-photos:')) {
          const debugValue = localStorage.getItem(debugKey)
          const debugParsed = debugValue ? JSON.parse(debugValue) : []
          console.log(`  ${debugKey}: ${debugParsed.length} photos`)
        }
      }
      
      if (!stored) {
        console.log(`📭 No photos found for team ${teamName}`)
        return [];
      }
      
      const parsed = JSON.parse(stored);
      console.log(`📊 Parsed ${parsed.length} photos:`, parsed)
      
      // Log each photo's details
      parsed.forEach((photo: PhotoRecord, index: number) => {
        console.log(`  Photo ${index + 1}: locationId=${photo.locationId}, url=${photo.photoUrl}`)
      })
      
      return parsed;
      
    } catch (error) {
      console.error('💥 Failed to get team photos:', error);
      return [];
    }
  }

  /**
   * Get all photos for a session (optionally team-specific)
   * @param sessionId The session ID
   * @param teamName The team name (optional, for team-specific storage)
   * @returns Promise resolving to array of photo records
   */
  static async getSessionPhotos(sessionId: string, teamName?: string): Promise<PhotoRecord[]> {
    try {
      // Use team-specific key if teamName is provided
      const key = teamName 
        ? `session-photos:${sessionId}:${teamName}` 
        : `session-photos:${sessionId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        // If team-specific data doesn't exist, start fresh to avoid team contamination
        if (teamName) {
          const oldKey = `session-photos:${sessionId}`;
          const oldStored = localStorage.getItem(oldKey);
          if (oldStored) {
            console.log(`🗑️ Found old photo data at ${oldKey} - clearing to prevent team contamination`);
            // Remove old data to prevent contamination
            localStorage.removeItem(oldKey);
          }
        }
        return [];
      }
      
      return JSON.parse(stored);
      
    } catch (error) {
      console.error('Failed to get session photos:', error);
      return [];
    }
  }
  
  /**
   * Save photos for a session (optionally team-specific)
   * @param sessionId The session ID
   * @param photos Array of photo records
   * @param teamName The team name (optional, for team-specific storage)
   */
  private static async saveSessionPhotos(
    sessionId: string, 
    photos: PhotoRecord[],
    teamName?: string
  ): Promise<void> {
    try {
      // Use team-specific key if teamName is provided
      const key = teamName 
        ? `session-photos:${sessionId}:${teamName}` 
        : `session-photos:${sessionId}`;
      localStorage.setItem(key, JSON.stringify(photos));
      
    } catch (error) {
      console.error('Failed to save session photos:', error);
      throw error;
    }
  }

  /**
   * Clear all photos for a specific team
   * @param teamName The team name
   * @param locationName The location name (for namespace)
   * @param eventName The event name (for namespace)
   */
  static async clearTeamPhotos(teamName: string, locationName?: string, eventName?: string): Promise<void> {
    try {
      // Create team-specific key
      const namespaced = locationName && eventName 
        ? `${locationName}-${eventName}-${teamName}`
        : teamName;
      const key = `team-photos:${namespaced}`;
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared photos for team: ${teamName}`);
    } catch (error) {
      console.error('Failed to clear team photos:', error);
      throw error;
    }
  }
  
  /**
   * Resize an image file before upload
   * @param file The image file to resize
   * @param maxWidth Maximum width (default: 1600)
   * @param quality Image quality 0-1 (default: 0.8)
   * @returns Promise resolving to resized File
   */
  private static async resizeImage(
    file: File, 
    maxWidth = 1600, 
    quality = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        if (ratio >= 1) {
          // Image is already small enough
          resolve(file);
          return;
        }
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
}