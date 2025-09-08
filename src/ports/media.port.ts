/**
 * Media Port
 * 
 * Clean interface for media upload operations (images and videos).
 * Adapters will implement this interface for different media providers.
 */

export interface MediaUploadOptions {
  resourceType: 'image' | 'video'
  teamName?: string
  locationName?: string
  eventName?: string
  orgSlug?: string
  huntSlug?: string
  stopId?: string
  sessionId?: string
  locationTitle?: string
}

export interface MediaUploadResponse {
  mediaType: 'image' | 'video'
  publicId: string
  url: string
  posterUrl?: string // For videos
  thumbnailUrl?: string // For both images and videos
  width?: number
  height?: number
  duration?: number // For videos
  createdAt: string
}

export interface UploadImageInput {
  file: File
  options: MediaUploadOptions
}

export interface UploadVideoInput {
  file: File
  options: MediaUploadOptions
}

export interface DeleteMediaInput {
  publicId: string
  resourceType: 'image' | 'video'
}

/**
 * Port interface for media operations
 */
export interface MediaPort {
  /**
   * Upload an image file to the media provider
   */
  uploadImage(input: UploadImageInput): Promise<MediaUploadResponse>
  
  /**
   * Upload a video file to the media provider
   */
  uploadVideo(input: UploadVideoInput): Promise<MediaUploadResponse>
  
  /**
   * Delete a media file from the provider
   */
  deleteMedia(input: DeleteMediaInput): Promise<void>
  
  /**
   * Generate a signed upload URL for direct client uploads (optional)
   */
  generateSignedUrl?(input: {
    resourceType: 'image' | 'video'
    options: MediaUploadOptions
  }): Promise<{
    url: string
    publicId: string
    signature: string
  }>
}