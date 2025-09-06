import { PhotoService } from '../../../services/PhotoService'
import { FeedPost, TeamInfo } from '../types'
import type { PhotoRecord } from '../../../store/appStore'

interface FeedFilters {
  locationName?: string
  eventName?: string
}

export class FeedService {
  /**
   * Get all team feed posts from Zustand store
   * Shows all photos for the specified company/event
   */
  static async getAllFeedPosts(filters?: FeedFilters): Promise<FeedPost[]> {
    try {
      console.log('🔍 FeedService: Getting photos for company/event feed...')
      console.log('🔍 Feed filters:', filters)
      
      if (!filters?.locationName || !filters?.eventName) {
        console.warn('⚠️ FeedService: Missing locationName or eventName for feed')
        return []
      }
      
      const { locationName, eventName } = filters
      
      // Get all photos for this company/event using the new PhotoService
      const photos = await PhotoService.getPhotosByCompanyEvent(locationName, eventName)
      
      if (!photos || photos.length === 0) {
        console.log(`📭 No photos found for ${locationName}/${eventName}`)
        return []
      }
      
      console.log(`📊 Found ${photos.length} total photos for ${locationName}/${eventName}`)
      
      // Transform photos into feed posts
      const allPosts: FeedPost[] = photos.map((photo: PhotoRecord) => {
        // Extract team name from photo metadata or use a default
        const teamName = this.extractTeamNameFromPhoto(photo)
        
        return {
          id: `${teamName}-${photo.locationId}-${photo.publicId}`,
          teamName: teamName,
          teamEmoji: this.getTeamEmoji(teamName),
          locationName: locationName,
          stopTitle: this.getStopTitle(photo.locationId),
          imageUrl: photo.photoUrl,
          caption: photo.title || this.generateCaption(teamName, photo.locationId),
          timestamp: photo.uploadedAt,
          reactions: {
            likes: Math.floor(Math.random() * 15) + 1, // Random likes for demo
            comments: Math.floor(Math.random() * 5),
            shares: Math.floor(Math.random() * 3)
          }
        }
      })
      
      // Sort by timestamp (newest first)
      allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      console.log(`📸 Generated ${allPosts.length} feed posts for ${locationName}/${eventName}`)
      
      return allPosts
      
    } catch (error) {
      console.error('❌ FeedService: Failed to fetch feed posts:', error)
      return []
    }
  }


  /**
   * Extract team name from photo metadata
   */
  private static extractTeamNameFromPhoto(photo: PhotoRecord & { teamName?: string }): string {
    // Use team name from photo record if available
    return photo.teamName || 'Unknown Team'
  }

  /**
   * Get emoji for team based on team name
   */
  private static getTeamEmoji(teamName: string): string {
    const name = teamName.toLowerCase()
    
    if (name.includes('rock')) return '🏔️'
    if (name.includes('alp')) return '🎿'
    if (name.includes('summit')) return '⛰️'
    if (name.includes('snow')) return '❄️'
    if (name.includes('eagle')) return '🦅'
    if (name.includes('bear')) return '🐻'
    if (name.includes('wolf')) return '🐺'
    if (name.includes('fire')) return '🔥'
    if (name.includes('storm')) return '⛈️'
    if (name.includes('star')) return '⭐'
    
    // Default emojis based on first letter
    const firstLetter = teamName.charAt(0).toLowerCase()
    const emojiMap: Record<string, string> = {
      a: '🏔️', b: '🎿', c: '⛰️', d: '❄️', e: '🦅',
      f: '🔥', g: '🌲', h: '🏂', i: '🧗', j: '🎯',
      k: '🏕️', l: '🦌', m: '🏔️', n: '🎿', o: '⛰️',
      p: '🐻', q: '❄️', r: '🏔️', s: '⛷️', t: '🏔️',
      u: '🦅', v: '🏂', w: '🐺', x: '❄️', y: '⛰️', z: '🎿'
    }
    
    return emojiMap[firstLetter] || '🏔️'
  }

  /**
   * Get user-friendly stop title from stop ID
   */
  private static getStopTitle(stopId: string): string {
    // Convert kebab-case to title case
    return stopId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Generate a caption for a post if none exists
   */
  private static generateCaption(teamName: string, stopId: string): string {
    const captions = [
      `Amazing experience at ${this.getStopTitle(stopId)}! 📸`,
      `${teamName} conquers another stop! 🎉`,
      `Perfect photo opportunity! ✨`,
      `Found it! Check out this awesome spot 🔍`,
      `Another one down! 💪`,
      `Great teamwork here! 👥`,
      `This place is incredible! 🤩`
    ]
    
    return captions[Math.floor(Math.random() * captions.length)]
  }
}