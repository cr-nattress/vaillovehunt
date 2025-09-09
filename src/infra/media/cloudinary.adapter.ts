/**
 * Cloudinary Media Adapter - Phase 4 Implementation
 * 
 * Complete implementation of MediaPort using Cloudinary for media operations.
 * Integrates with server-side upload endpoints and direct Cloudinary APIs.
 */

import {
  MediaPort,
  MediaUploadResponse,
  UploadImageInput,
  UploadVideoInput,
  DeleteMediaInput,
  MediaUploadOptions
} from '../../ports/media.port'
import { getConfig } from '../../config/config'
import { v2 as cloudinary } from 'cloudinary'

/**
 * Configuration for Cloudinary adapter
 */
interface CloudinaryAdapterConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  uploadFolder: string
  autoOptimize: boolean
  generateThumbnails: boolean
}

/**
 * Default configuration factory
 */
function getCloudinaryConfig(): CloudinaryAdapterConfig {
  const config = getConfig()
  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    apiSecret: config.cloudinary.apiSecret,
    uploadFolder: config.cloudinary.uploadFolder,
    autoOptimize: true,
    generateThumbnails: true
  }
}

export class CloudinaryMediaAdapter implements MediaPort {
  private config: CloudinaryAdapterConfig
  
  constructor(config?: Partial<CloudinaryAdapterConfig>) {
    this.config = { ...getCloudinaryConfig(), ...config }
    
    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret
    })
    
    console.log('☁️ CloudinaryMediaAdapter initialized:', {
      cloudName: this.config.cloudName,
      uploadFolder: this.config.uploadFolder,
      autoOptimize: this.config.autoOptimize
    })
  }

  /**
   * Upload image to Cloudinary with optimization and thumbnail generation
   */
  async uploadImage(input: UploadImageInput): Promise<MediaUploadResponse> {
    try {
      console.log('🖼️ CloudinaryMediaAdapter.uploadImage:', {
        fileName: input.file.name,
        size: input.file.size,
        type: input.file.type,
        options: input.options
      })

      const publicId = this.generatePublicId(input.options, 'image')
      const tags = this.generateTags(input.options, 'image')

      // Convert File to buffer for upload
      const buffer = await this.fileToBuffer(input.file)

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: this.config.uploadFolder,
            public_id: publicId,
            tags: tags,
            context: this.generateContext(input.options),
            resource_type: 'image',
            format: 'jpg', // Auto-convert to optimized format
            quality: this.config.autoOptimize ? 'auto:good' : 'auto',
            transformation: [
              { fetch_format: 'auto' }, // Auto-select best format for browser
              { quality: 'auto' }
            ],
            // Generate thumbnails eagerly
            eager: this.config.generateThumbnails ? [
              { width: 300, height: 300, crop: 'fill', quality: 'auto:good' }, // Thumbnail
              { width: 150, height: 150, crop: 'fill', quality: 'auto:good' }  // Small thumbnail
            ] : undefined,
            eager_async: false // Generate synchronously for immediate availability
          },
          (error, result) => {
            if (error) {
              console.error('☁️ Cloudinary image upload failed:', error)
              reject(error)
            } else {
              console.log('✅ Cloudinary image upload successful:', result?.public_id)
              resolve(result)
            }
          }
        ).end(buffer)
      })

      const response: MediaUploadResponse = {
        mediaType: 'image',
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        thumbnailUrl: uploadResult.eager?.[0]?.secure_url, // First eager transformation
        width: uploadResult.width,
        height: uploadResult.height,
        createdAt: new Date().toISOString()
      }

      console.log('🖼️ Image upload completed:', response.publicId)
      return response

    } catch (error) {
      console.error('❌ CloudinaryMediaAdapter.uploadImage failed:', error)
      throw error
    }
  }

  /**
   * Upload video to Cloudinary with poster and thumbnail generation
   */
  async uploadVideo(input: UploadVideoInput): Promise<MediaUploadResponse> {
    try {
      console.log('🎬 CloudinaryMediaAdapter.uploadVideo:', {
        fileName: input.file.name,
        size: input.file.size,
        type: input.file.type,
        options: input.options
      })

      const publicId = this.generatePublicId(input.options, 'video')
      const tags = this.generateTags(input.options, 'video')

      // Convert File to buffer for upload
      const buffer = await this.fileToBuffer(input.file)

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: this.config.uploadFolder,
            public_id: publicId,
            tags: tags,
            context: this.generateContext(input.options),
            resource_type: 'video',
            quality: this.config.autoOptimize ? 'auto:good' : 'auto',
            // Generate poster and thumbnail images eagerly
            eager: this.config.generateThumbnails ? [
              { format: 'jpg', quality: 'auto:good', transformation: [{ fetch_format: 'auto' }] }, // Poster
              { format: 'jpg', width: 300, height: 300, crop: 'fill', quality: 'auto:good' }, // Thumbnail
              { format: 'jpg', width: 150, height: 150, crop: 'fill', quality: 'auto:good' }  // Small thumbnail
            ] : undefined,
            eager_async: false // Generate synchronously
          },
          (error, result) => {
            if (error) {
              console.error('☁️ Cloudinary video upload failed:', error)
              reject(error)
            } else {
              console.log('✅ Cloudinary video upload successful:', result?.public_id)
              resolve(result)
            }
          }
        ).end(buffer)
      })

      const response: MediaUploadResponse = {
        mediaType: 'video',
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        posterUrl: uploadResult.eager?.[0]?.secure_url, // First eager transformation (poster)
        thumbnailUrl: uploadResult.eager?.[1]?.secure_url, // Second eager transformation (thumbnail)
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        createdAt: new Date().toISOString()
      }

      console.log('🎬 Video upload completed:', response.publicId)
      return response

    } catch (error) {
      console.error('❌ CloudinaryMediaAdapter.uploadVideo failed:', error)
      throw error
    }
  }

  /**
   * Delete media from Cloudinary
   */
  async deleteMedia(input: DeleteMediaInput): Promise<void> {
    try {
      console.log('🗑️ CloudinaryMediaAdapter.deleteMedia:', input.publicId, input.resourceType)

      const result = await cloudinary.uploader.destroy(input.publicId, {
        resource_type: input.resourceType
      })

      if (result.result !== 'ok') {
        throw new Error(`Delete failed: ${result.result}`)
      }

      console.log('✅ Media deletion successful:', input.publicId)

    } catch (error) {
      console.error('❌ CloudinaryMediaAdapter.deleteMedia failed:', error)
      throw error
    }
  }

  /**
   * Generate signed URL for direct client uploads
   */
  async generateSignedUrl(input: {
    resourceType: 'image' | 'video'
    options: MediaUploadOptions
  }): Promise<{ url: string; publicId: string; signature: string }> {
    try {
      console.log('🔐 CloudinaryMediaAdapter.generateSignedUrl:', input.resourceType)

      const publicId = this.generatePublicId(input.options, input.resourceType)
      const timestamp = Math.round(new Date().getTime() / 1000)
      
      const uploadParams = {
        folder: this.config.uploadFolder,
        public_id: publicId,
        tags: this.generateTags(input.options, input.resourceType).join(','),
        context: this.generateContextString(input.options),
        resource_type: input.resourceType,
        timestamp: timestamp
      }

      const signature = cloudinary.utils.api_sign_request(uploadParams, this.config.apiSecret)
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${input.resourceType}/upload`

      console.log('✅ Signed URL generated:', publicId)

      return {
        url: uploadUrl,
        publicId: publicId,
        signature: signature
      }

    } catch (error) {
      console.error('❌ CloudinaryMediaAdapter.generateSignedUrl failed:', error)
      throw error
    }
  }

  /**
   * Helper: Convert File to Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Helper: Generate public ID for uploads
   */
  private generatePublicId(options: MediaUploadOptions, resourceType: 'image' | 'video'): string {
    const timestamp = Date.now()
    const sessionPart = options.sessionId || 'session'
    const titlePart = options.locationTitle ? 
      options.locationTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') : 
      'media'
    
    return `${sessionPart}/${titlePart}_${timestamp}`
  }

  /**
   * Helper: Generate tags for organization
   */
  private generateTags(options: MediaUploadOptions, resourceType: 'image' | 'video'): string[] {
    const tags = ['vail-scavenger', `individual-${resourceType}`]
    
    if (options.teamName) {
      tags.push(`team:${options.teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
    }
    if (options.locationName) {
      tags.push(`location:${options.locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
    }
    if (options.orgSlug) {
      tags.push(`org:${options.orgSlug}`)
    }
    if (options.huntSlug) {
      tags.push(`hunt:${options.huntSlug}`)
    }
    if (options.stopId) {
      tags.push(`stop:${options.stopId}`)
    }
    
    return tags
  }

  /**
   * Helper: Generate context metadata object
   */
  private generateContext(options: MediaUploadOptions): Record<string, string> {
    const context: Record<string, string> = {
      upload_time: new Date().toISOString(),
      upload_type: `individual_${options.resourceType}`
    }
    
    if (options.teamName) context.team_name = options.teamName
    if (options.locationName) context.company_name = options.locationName
    if (options.eventName) context.event_name = options.eventName
    if (options.sessionId) context.session_id = options.sessionId
    if (options.locationTitle) context.location_title = options.locationTitle
    if (options.orgSlug) context.org_slug = options.orgSlug
    if (options.huntSlug) context.hunt_slug = options.huntSlug
    if (options.stopId) context.stop_id = options.stopId
    
    return context
  }

  /**
   * Helper: Generate context string for signed uploads
   */
  private generateContextString(options: MediaUploadOptions): string {
    const context = this.generateContext(options)
    return Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|')
  }
}