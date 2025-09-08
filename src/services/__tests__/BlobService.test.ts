/**
 * Tests for BlobService with mock implementations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BlobService } from '../BlobService'

// Mock the API client module
vi.mock('../../client/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

import { apiClient } from '../../client/apiClient'

describe('BlobService', () => {
  let blobService: BlobService

  beforeEach(() => {
    blobService = new BlobService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('readJson', () => {
    it('should successfully read JSON data', async () => {
      const mockResponse = {
        data: {
          data: { test: 'data', number: 42 },
          etag: 'mock-etag-123'
        }
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await blobService.readJson('test-key')

      expect(apiClient.get).toHaveBeenCalledWith('/kv-get?key=test-key')
      expect(result).toEqual({
        data: { test: 'data', number: 42 },
        etag: 'mock-etag-123'
      })
    })

    it('should handle URL encoding for keys with special characters', async () => {
      const mockResponse = {
        data: {
          data: { test: 'data' },
          etag: 'mock-etag'
        }
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await blobService.readJson('org/special key with spaces.json')

      expect(apiClient.get).toHaveBeenCalledWith('/kv-get?key=org%2Fspecial%20key%20with%20spaces.json')
    })

    it('should handle error responses', async () => {
      const mockResponse = {
        data: {
          error: 'Key not found',
          data: null,
          etag: undefined
        }
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await expect(blobService.readJson('non-existent-key')).rejects.toThrow('Key not found')
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout')
      vi.mocked(apiClient.get).mockRejectedValue(networkError)

      await expect(blobService.readJson('test-key')).rejects.toThrow('Network timeout')
    })

    it('should handle missing data in response', async () => {
      const mockResponse = {
        data: {
          data: null,
          etag: undefined
        }
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await expect(blobService.readJson('empty-key')).rejects.toThrow('No data returned from blob storage')
    })
  })

  describe('writeJson', () => {
    it('should successfully write JSON data', async () => {
      const mockResponse = {
        data: {
          success: true,
          etag: 'new-etag-456'
        }
      }

      const testData = { test: 'data', array: [1, 2, 3] }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await blobService.writeJson('test-key', testData)

      expect(apiClient.post).toHaveBeenCalledWith('/kv-set', {
        key: 'test-key',
        data: testData
      })
      expect(result).toEqual({
        success: true,
        etag: 'new-etag-456'
      })
    })

    it('should include etag for conditional writes', async () => {
      const mockResponse = {
        data: {
          success: true,
          etag: 'updated-etag'
        }
      }

      const testData = { updated: true }
      const expectedEtag = 'existing-etag-123'

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await blobService.writeJson('test-key', testData, expectedEtag)

      expect(apiClient.post).toHaveBeenCalledWith('/kv-set', {
        key: 'test-key',
        data: testData,
        etag: expectedEtag
      })
    })

    it('should handle write errors', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Etag mismatch - concurrent modification detected'
        }
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await expect(blobService.writeJson('test-key', { data: 'test' }))
        .rejects.toThrow('Etag mismatch - concurrent modification detected')
    })

    it('should handle network errors during write', async () => {
      const networkError = new Error('Connection refused')
      vi.mocked(apiClient.post).mockRejectedValue(networkError)

      await expect(blobService.writeJson('test-key', { data: 'test' }))
        .rejects.toThrow('Connection refused')
    })

    it('should serialize complex objects correctly', async () => {
      const mockResponse = {
        data: {
          success: true,
          etag: 'complex-etag'
        }
      }

      const complexData = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 'two', { three: 3 }],
        nested: {
          deep: {
            value: 'nested value',
            timestamp: new Date().toISOString()
          }
        }
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await blobService.writeJson('complex-key', complexData)

      expect(apiClient.post).toHaveBeenCalledWith('/kv-set', {
        key: 'complex-key',
        data: complexData
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle read-modify-write cycle with etag', async () => {
      // First read
      const readResponse = {
        data: {
          data: { version: 1, content: 'original' },
          etag: 'original-etag'
        }
      }

      // Then write
      const writeResponse = {
        data: {
          success: true,
          etag: 'updated-etag'
        }
      }

      vi.mocked(apiClient.get).mockResolvedValue(readResponse)
      vi.mocked(apiClient.post).mockResolvedValue(writeResponse)

      // Read current data
      const currentData = await blobService.readJson('version-key')
      expect(currentData.data).toEqual({ version: 1, content: 'original' })
      expect(currentData.etag).toBe('original-etag')

      // Modify and write back
      const updatedData = {
        version: 2,
        content: 'updated',
        timestamp: new Date().toISOString()
      }

      const writeResult = await blobService.writeJson('version-key', updatedData, currentData.etag)
      expect(writeResult.success).toBe(true)
      expect(writeResult.etag).toBe('updated-etag')

      // Verify the write request included the etag
      expect(apiClient.post).toHaveBeenCalledWith('/kv-set', {
        key: 'version-key',
        data: updatedData,
        etag: 'original-etag'
      })
    })

    it('should handle concurrent modification scenario', async () => {
      const writeResponse = {
        data: {
          success: false,
          error: 'Etag mismatch - data was modified by another process'
        }
      }

      vi.mocked(apiClient.post).mockResolvedValue(writeResponse)

      await expect(blobService.writeJson('contested-key', { data: 'test' }, 'stale-etag'))
        .rejects.toThrow('Etag mismatch - data was modified by another process')
    })
  })
})