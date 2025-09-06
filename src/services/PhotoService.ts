import { apiClient } from './apiClient'
import { validateSchema } from '../types/schemas'
import type { PhotoRecord } from '../store/appStore'

interface PhotosByCompanyEventResponse {
  photos: PhotoRecord[]
  totalCount: number
  companyName: string
  eventName: string
}

interface PhotosByTeamResponse {
  photos: PhotoRecord[]
  totalCount: number
  companyName: string
  eventName: string
  teamName: string
}

export class PhotoService {
  /**
   * Get all photos for a company and event (all teams)
   * @param companyName The company/location name (e.g., 'BHHS')
   * @param eventName The event name (e.g., 'Vail')
   * @returns Promise resolving to all team photos for the company/event
   */
  static async getPhotosByCompanyEvent(
    companyName: string, 
    eventName: string
  ): Promise<PhotoRecord[]> {
    try {
      console.log(`🔍 PhotoService: Getting photos for company=${companyName}, event=${eventName}`)
      
      if (!companyName || !eventName) {
        console.warn('⚠️ PhotoService: Missing companyName or eventName')
        return []
      }
      
      const response = await apiClient.request<PhotosByCompanyEventResponse>(
        `/photos/company/${encodeURIComponent(companyName)}/event/${encodeURIComponent(eventName)}`,
        {
          method: 'GET'
        }
      )
      
      console.log(`📸 PhotoService: Found ${response.photos.length} photos for ${companyName}/${eventName}`)
      
      return response.photos || []
      
    } catch (error) {
      console.error('❌ PhotoService: Failed to get photos by company/event:', error)
      return []
    }
  }

  /**
   * Get photos for a specific team within a company and event
   * @param companyName The company/location name (e.g., 'BHHS')
   * @param eventName The event name (e.g., 'Vail') 
   * @param teamName The team name (e.g., 'Blue', 'Red')
   * @returns Promise resolving to team photos
   */
  static async getPhotosByTeam(
    companyName: string,
    eventName: string, 
    teamName: string
  ): Promise<PhotoRecord[]> {
    try {
      console.log(`🔍 PhotoService: Getting photos for company=${companyName}, event=${eventName}, team=${teamName}`)
      
      if (!companyName || !eventName || !teamName) {
        console.warn('⚠️ PhotoService: Missing companyName, eventName, or teamName')
        return []
      }
      
      const response = await apiClient.request<PhotosByTeamResponse>(
        `/photos/company/${encodeURIComponent(companyName)}/event/${encodeURIComponent(eventName)}/team/${encodeURIComponent(teamName)}`,
        {
          method: 'GET'
        }
      )
      
      console.log(`📸 PhotoService: Found ${response.photos.length} photos for ${companyName}/${eventName}/${teamName}`)
      
      return response.photos || []
      
    } catch (error) {
      console.error('❌ PhotoService: Failed to get photos by team:', error)
      return []
    }
  }

  /**
   * Save a photo for a team (called after successful upload)
   * @param companyName The company/location name
   * @param eventName The event name
   * @param teamName The team name
   * @param photo The photo record to save
   */
  static async saveTeamPhoto(
    companyName: string,
    eventName: string,
    teamName: string,
    photo: PhotoRecord
  ): Promise<boolean> {
    try {
      console.log(`💾 PhotoService: Saving photo for company=${companyName}, event=${eventName}, team=${teamName}`)
      
      const response = await apiClient.request<{ success: boolean }>(
        `/photos/company/${encodeURIComponent(companyName)}/event/${encodeURIComponent(eventName)}/team/${encodeURIComponent(teamName)}`,
        {
          method: 'POST',
          body: JSON.stringify(photo),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log(`✅ PhotoService: Photo saved successfully`)
      return response.success || false
      
    } catch (error) {
      console.error('❌ PhotoService: Failed to save team photo:', error)
      return false
    }
  }

  /**
   * Delete a photo for a team
   * @param companyName The company/location name
   * @param eventName The event name
   * @param teamName The team name
   * @param locationId The location ID of the photo to delete
   */
  static async deleteTeamPhoto(
    companyName: string,
    eventName: string,
    teamName: string,
    locationId: string
  ): Promise<boolean> {
    try {
      console.log(`🗑️ PhotoService: Deleting photo for company=${companyName}, event=${eventName}, team=${teamName}, location=${locationId}`)
      
      const response = await apiClient.request<{ success: boolean }>(
        `/photos/company/${encodeURIComponent(companyName)}/event/${encodeURIComponent(eventName)}/team/${encodeURIComponent(teamName)}/location/${encodeURIComponent(locationId)}`,
        {
          method: 'DELETE'
        }
      )
      
      console.log(`✅ PhotoService: Photo deleted successfully`)
      return response.success || false
      
    } catch (error) {
      console.error('❌ PhotoService: Failed to delete team photo:', error)
      return false
    }
  }
}