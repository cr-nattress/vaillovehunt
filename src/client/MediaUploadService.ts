import { apiClient } from '../services/apiClient'
import { 
  UploadResponseSchema,
  validateSchema,
  type UploadResponse
} from '../types/schemas'

// Extended response for media uploads
export interface MediaUploadResponse extends UploadResponse {
  mediaType: 'image' | 'video'
  posterUrl?: string // For videos
  thumbnailUrl?: string // For both images and videos
}

export interface MediaUploadOptions {
  resourceType: 'image' | 'video'
  teamName?: string
  locationName?: string
  eventName?: string
  orgSlug?: string
  huntSlug?: string
  stopId?: string
}

export class MediaUploadService {
  // Size limits
  private static readonly MAX_IMAGE_SIZE = 12 * 1024 * 1024 // 12MB
  private static readonly MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB

  // Allowed file types
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

  /**
   * Validate media file for upload
   */
  private static validateMediaFile(file: File): { isValid: boolean; error?: string; mediaType?: 'image' | 'video' } {
    if (!file) return { isValid: false, error: 'No file provided' }

    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return { isValid: false, error: 'File must be an image or video' }
    }

    const mediaType = isImage ? 'image' : 'video'
    const maxSize = isImage ? this.MAX_IMAGE_SIZE : this.MAX_VIDEO_SIZE
    const sizeLimit = isImage ? '12MB' : '200MB'

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be under ${sizeLimit}` }
    }

    return { isValid: true, mediaType }
  }

  /**
   * Upload media (image or video) for a specific location/step
   * @param file The media file to upload
   * @param locationTitle The title of the location/step
   * @param sessionId The current session ID
   * @param options Upload options including resourceType and metadata
   * @returns Promise resolving to media upload response
   */
  static async uploadMedia(
    file: File, 
    locationTitle: string, 
    sessionId: string,
    options: MediaUploadOptions
  ): Promise<MediaUploadResponse> {
    console.log('🎬 MediaUploadService.uploadMedia() called');
    console.log('  File:', { name: file.name, size: file.size, type: file.type });
    console.log('  Location:', locationTitle);
    console.log('  Session:', sessionId);
    console.log('  Options:', options);
    
    // Validate inputs
    const validation = this.validateMediaFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file')
    }

    if (!locationTitle) {
      throw new Error('Location title is required')
    }

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    const mediaType = validation.mediaType!
    
    console.log(`✅ Input validation passed - detected ${mediaType}`)
    
    // Create FormData
    const formData = new FormData()
    formData.append('media', file)
    formData.append('locationTitle', locationTitle)
    formData.append('sessionId', sessionId)
    formData.append('resourceType', mediaType)
    
    // Add optional metadata
    if (options.teamName) formData.append('teamName', options.teamName)
    if (options.locationName) formData.append('locationName', options.locationName)
    if (options.eventName) formData.append('eventName', options.eventName)
    if (options.orgSlug) formData.append('orgSlug', options.orgSlug)
    if (options.huntSlug) formData.append('huntSlug', options.huntSlug)
    if (options.stopId) formData.append('stopId', options.stopId)
    
    console.log(`📦 FormData created for ${mediaType} upload`)
    
    try {
      console.log('🌐 Making media upload API request...')
      
      const endpoint = mediaType === 'video' ? '/video-upload' : '/photo-upload'
      const timeout = mediaType === 'video' ? 300000 : 60000 // 5min for video, 1min for image
      
      const rawResponse = await apiClient.requestFormData<unknown>(endpoint, formData, {
        timeout,
        retryAttempts: 1 // Reduce retries for large video files
      })
      
      // Validate response with schema
      const response = validateSchema(UploadResponseSchema, rawResponse, 'media upload')
      
      // Enhance response with media type info
      const mediaResponse: MediaUploadResponse = {
        ...response,
        mediaType,
        // Cloudinary automatically generates poster for videos
        posterUrl: mediaType === 'video' ? response.photoUrl?.replace('/upload/', '/upload/f_jpg,q_auto/') : undefined,
        thumbnailUrl: response.photoUrl?.replace('/upload/', '/upload/c_thumb,w_200,h_200,g_face/')
      }
      
      console.log(`📊 ${mediaType} upload successful:`, mediaResponse)
      
      return mediaResponse
      
    } catch (error) {
      console.error(`💥 ${mediaType} upload error:`, error)
      throw error
    }
  }

  /**
   * Legacy method for backward compatibility with PhotoUploadService
   */
  static async uploadPhoto(
    file: File, 
    locationTitle: string, 
    sessionId: string,
    teamName?: string,
    locationName?: string,
    eventName?: string
  ): Promise<UploadResponse> {
    const response = await this.uploadMedia(file, locationTitle, sessionId, {
      resourceType: 'image',
      teamName,
      locationName,
      eventName
    })

    // Return compatible response (without video-specific fields)
    return {
      photoUrl: response.photoUrl,
      publicId: response.publicId,
      locationSlug: response.locationSlug,
      title: response.title,
      uploadedAt: response.uploadedAt
    }
  }

  /**
   * Generate folder structure for organized uploads
   */
  static generateUploadFolder(orgSlug: string, huntSlug: string, stopId?: string): string {
    const base = `${orgSlug}/${huntSlug}`
    return stopId ? `${base}/stops/${stopId}` : base
  }

  /**
   * Generate tags for Cloudinary organization
   */
  static generateUploadTags(options: {
    orgSlug: string
    huntId?: string
    teamName?: string
    stopId?: string
    mediaType: 'image' | 'video'
  }): string[] {
    const tags = [
      'vail-hunt',
      options.mediaType,
      `org:${options.orgSlug}`
    ]

    if (options.huntId) tags.push(`hunt:${options.huntId}`)
    if (options.teamName) tags.push(`team:${options.teamName}`)
    if (options.stopId) tags.push(`stop:${options.stopId}`)

    return tags
  }
}

// Re-export for backward compatibility
export const PhotoUploadService = MediaUploadService
export type PhotoUploadResponse = UploadResponse