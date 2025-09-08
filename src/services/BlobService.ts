/**
 * BlobService - Client abstraction for reading/writing JSON data to Netlify Blobs
 * Provides a clean interface for blob operations with etag support
 */

import { apiClient } from './apiClient'

export interface BlobResult<T = unknown> {
  data: T
  etag?: string
}

export interface WriteResult {
  etag?: string
  key: string
  timestamp: string
}

export class BlobService {
  private static instance: BlobService

  static getInstance(): BlobService {
    if (!BlobService.instance) {
      BlobService.instance = new BlobService()
    }
    return BlobService.instance
  }

  /**
   * Read JSON data from a blob
   */
  async readJson<T = unknown>(key: string): Promise<BlobResult<T>> {
    try {
      console.log(`🔍 BlobService: Reading JSON from blob storage:`, { key })
      
      const response = await apiClient.get<{
        data?: T
        error?: string
        etag?: string
      }>(`/kv-get?key=${encodeURIComponent(key)}`)
      
      if (response.error) {
        console.error(`❌ BlobService: Read error for key ${key}:`, response.error)
        throw new Error(`Failed to read blob ${key}: ${response.error}`)
      }
      
      if (!response.data) {
        console.error(`❌ BlobService: No data returned for key ${key}`)
        throw new Error(`Blob ${key} not found`)
      }
      
      console.log(`✅ BlobService: Successfully read JSON:`, { 
        key, 
        etag: response.etag,
        dataSize: JSON.stringify(response.data).length 
      })
      console.log(`📋 BlobService: Read JSON Data for ${key}:`, JSON.stringify(response.data, null, 2))
      
      return {
        data: response.data,
        etag: response.etag
      }
    } catch (error) {
      console.error(`❌ BlobService: Failed to read ${key}:`, error)
      throw error
    }
  }

  /**
   * Write JSON data to a blob with optional etag for optimistic concurrency
   */
  async writeJson<T = unknown>(
    key: string, 
    data: T, 
    expectedEtag?: string
  ): Promise<WriteResult> {
    try {
      console.log(`💾 BlobService: Writing JSON to blob storage:`, { 
        key, 
        expectedEtag,
        dataSize: JSON.stringify(data).length 
      })
      console.log(`📋 BlobService: Write JSON Data for ${key}:`, JSON.stringify(data, null, 2))
      
      const payload: {
        key: string
        value: T
        expectedEtag?: string
      } = {
        key,
        value: data
      }
      
      if (expectedEtag) {
        payload.expectedEtag = expectedEtag
      }
      
      const response = await apiClient.post<{
        ok?: boolean
        etag?: string
        key: string
        timestamp: string
        error?: string
      }>('/kv-upsert', payload)
      
      if (response.error) {
        console.error(`❌ BlobService: Write error for key ${key}:`, response.error)
        throw new Error(`Failed to write blob ${key}: ${response.error}`)
      }
      
      console.log(`✅ BlobService: Successfully wrote JSON:`, { 
        key, 
        newEtag: response.etag, 
        timestamp: response.timestamp 
      })
      return {
        etag: response.etag,
        key: response.key,
        timestamp: response.timestamp
      }
    } catch (error) {
      console.error(`❌ BlobService: Failed to write ${key}:`, error)
      throw error
    }
  }

  /**
   * Check if a blob exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.readJson(key)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * List blobs with a prefix (if supported by backend)
   * TODO: Implement when kv-list function supports prefix filtering
   */
  async listWithPrefix(prefix: string): Promise<string[]> {
    try {
      console.log(`🔍 BlobService: Listing blobs with prefix ${prefix}`)
      
      // TODO: This would need a new function or enhancement to kv-list
      // For now, return empty array as this is not critical for Phase 1
      console.warn(`⚠️ BlobService: listWithPrefix not yet implemented`)
      return []
    } catch (error) {
      console.error(`❌ BlobService: Failed to list with prefix ${prefix}:`, error)
      throw error
    }
  }

  /**
   * Delete a blob
   * TODO: Implement when kv-delete function is available
   */
  async delete(key: string): Promise<void> {
    try {
      console.log(`🗑️ BlobService: Deleting ${key}`)
      
      // TODO: This would need a kv-delete function
      // For now, this is not critical for the MVP
      console.warn(`⚠️ BlobService: delete not yet implemented`)
    } catch (error) {
      console.error(`❌ BlobService: Failed to delete ${key}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const blobService = BlobService.getInstance()
export default BlobService