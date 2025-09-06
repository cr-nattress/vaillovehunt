# Phase 4: Feed Service Implementation

## 🎯 **Objective**
Create the FeedService to fetch real team data from DualWriteService and transform it into feed posts. Replace mock data with actual team submissions.

## 📋 **Prerequisites**
- Phase 1, 2, & 3 must be completed and verified
- Feed page should show mock posts correctly
- All UI components should be functional

## 🔧 **Tasks**

### 1. Create Feed Service
Create `src/features/feed/services/FeedService.ts`:
```typescript
import { DualWriteService } from '../../../client/DualWriteService'
import { FeedPost, TeamInfo } from '../types'

interface TeamProgress {
  [stopId: string]: {
    done: boolean
    notes: string
    photo: string | null
    revealedHints: number
    completedAt?: string
  }
}

interface TeamData {
  progress: TeamProgress
  teamName: string
  locationName: string
  eventName: string
  sessionId: string
}

export class FeedService {
  /**
   * Get all team feed posts by scanning DualWriteService for team data
   */
  static async getAllFeedPosts(): Promise<FeedPost[]> {
    try {
      console.log('🔍 FeedService: Fetching all team data...')
      
      // Get list of all stored keys from DualWriteService
      const allKeys = await this.getAllTeamKeys()
      console.log(`📊 Found ${allKeys.length} team keys`)
      
      // Fetch data for each team
      const teamDataPromises = allKeys.map(key => 
        this.getTeamData(key).catch(error => {
          console.warn(`⚠️ Failed to fetch data for ${key}:`, error)
          return null
        })
      )
      
      const teamDataResults = await Promise.all(teamDataPromises)
      const teamData = teamDataResults.filter(data => data !== null) as TeamData[]
      
      console.log(`✅ Successfully loaded ${teamData.length} teams`)
      
      // Transform team data into feed posts
      const allPosts: FeedPost[] = []
      
      for (const team of teamData) {
        const posts = this.transformTeamDataToPosts(team)
        allPosts.push(...posts)
      }
      
      // Sort by timestamp (newest first)
      allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      console.log(`📸 Generated ${allPosts.length} feed posts`)
      return allPosts
      
    } catch (error) {
      console.error('❌ FeedService: Failed to fetch feed posts:', error)
      return []
    }
  }

  /**
   * Get all team keys from storage
   * This is a simplified approach - in production you might have a dedicated index
   */
  private static async getAllTeamKeys(): Promise<string[]> {
    try {
      // Try to get a list of all keys from the server
      const response = await fetch('/api/kv-list')
      if (response.ok) {
        const data = await response.json()
        return data.keys?.filter((key: string) => 
          key.includes('progress-') || key.includes('team-')
        ) || []
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch keys from server:', error)
    }
    
    // Fallback: scan localStorage for team data
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('progress-') || key.includes('team-'))) {
        keys.push(key)
      }
    }
    
    return keys
  }

  /**
   * Get team data for a specific key
   */
  private static async getTeamData(key: string): Promise<TeamData | null> {
    try {
      const data = await DualWriteService.get(key)
      
      if (!data) {
        return null
      }
      
      // Try to extract team info from the key or data
      const teamInfo = this.extractTeamInfo(key, data)
      
      if (!teamInfo.teamName) {
        console.warn(`⚠️ No team name found for key: ${key}`)
        return null
      }
      
      return {
        progress: data.progress || data, // Handle different data structures
        teamName: teamInfo.teamName,
        locationName: teamInfo.locationName || 'Unknown Location',
        eventName: teamInfo.eventName || '',
        sessionId: teamInfo.sessionId || key
      }
    } catch (error) {
      console.warn(`⚠️ Failed to get team data for ${key}:`, error)
      return null
    }
  }

  /**
   * Extract team information from key or data
   */
  private static extractTeamInfo(key: string, data: any): Partial<TeamData> {
    // Try to extract from data first
    if (data.teamName) {
      return {
        teamName: data.teamName,
        locationName: data.locationName,
        eventName: data.eventName,
        sessionId: data.sessionId
      }
    }
    
    // Try to extract from key pattern (e.g., "progress-BHHS-event-teamname")
    const keyParts = key.split('-')
    if (keyParts.length >= 3) {
      return {
        teamName: keyParts.slice(3).join('-'), // Everything after location-event
        locationName: keyParts[1],
        eventName: keyParts[2]
      }
    }
    
    // Fallback: use key as team identifier
    return {
      teamName: key.replace(/^(progress-|team-)/, ''),
      locationName: 'Vail',
      eventName: 'Hunt'
    }
  }

  /**
   * Transform team progress data into feed posts
   */
  private static transformTeamDataToPosts(team: TeamData): FeedPost[] {
    const posts: FeedPost[] = []
    
    // Get team emoji based on team name
    const teamEmoji = this.getTeamEmoji(team.teamName)
    
    // Process each completed stop with a photo
    Object.entries(team.progress).forEach(([stopId, progress]) => {
      if (progress.done && progress.photo) {
        const post: FeedPost = {
          id: `${team.sessionId}-${stopId}`,
          teamName: team.teamName,
          teamEmoji: teamEmoji,
          locationName: team.locationName,
          stopTitle: this.getStopTitle(stopId),
          imageUrl: progress.photo,
          caption: progress.notes || this.generateCaption(team.teamName, stopId),
          timestamp: progress.completedAt || new Date().toISOString(),
          reactions: {
            likes: Math.floor(Math.random() * 15) + 1, // Random likes for now
            comments: Math.floor(Math.random() * 5),
            shares: Math.floor(Math.random() * 3)
          }
        }
        
        posts.push(post)
      }
    })
    
    return posts
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
```

### 2. Update FeedPage to Use Real Data
Modify `src/features/feed/components/FeedPage.tsx`:
```typescript
import React, { useState, useEffect } from 'react'
import { PageType } from '../../../hooks/useHashRouter'
import FeedHeader from './FeedHeader'
import PostCard from './PostCard'
import { FeedPost } from '../types'
import { FeedService } from '../services/FeedService'

interface FeedPageProps {
  onNavigate: (page: PageType) => void
}

export default function FeedPage({ onNavigate }: FeedPageProps) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeedPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const feedPosts = await FeedService.getAllFeedPosts()
      setPosts(feedPosts)
      
      if (feedPosts.length === 0) {
        console.log('📭 No feed posts found - teams may not have uploaded photos yet')
      }
      
    } catch (error) {
      console.error('❌ Failed to load feed posts:', error)
      setError('Failed to load feed posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeedPosts()
  }, [])

  const handleRefresh = () => {
    loadFeedPosts()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader onNavigate={onNavigate} onRefresh={handleRefresh} />
      
      <main className="max-w-screen-sm mx-auto px-4 py-4">
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            <PostCard post={{} as FeedPost} isLoading={true} />
            <PostCard post={{} as FeedPost} isLoading={true} />
            <PostCard post={{} as FeedPost} isLoading={true} />
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length > 0 ? (
          // Posts
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Teams haven't uploaded photos yet, or you might be the first!</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Feed
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
```

### 3. Update FeedHeader with Refresh Button
Modify `src/features/feed/components/FeedHeader.tsx`:
```typescript
interface FeedHeaderProps {
  onNavigate: (page: PageType) => void
  onRefresh?: () => void
}

export default function FeedHeader({ onNavigate, onRefresh }: FeedHeaderProps) {
  // ... existing code ...
  
  {/* Update refresh button */}
  <button 
    onClick={onRefresh}
    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
    disabled={!onRefresh}
  >
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </button>
}
```

## ✅ **Verification Steps**

### Test Data Integration:
1. **Real team data**: Should show posts from actual team submissions
2. **Image URLs**: Should display real uploaded images from teams
3. **Team names**: Should show actual team names from stored data
4. **Timestamps**: Should show when teams completed stops
5. **Empty state**: Should handle when no teams have uploaded photos

### Test Service Functions:
1. **Data fetching**: Check console logs for successful data retrieval
2. **Error handling**: Should gracefully handle network failures
3. **Data transformation**: Team progress should convert to proper posts
4. **Sorting**: Posts should appear newest first
5. **Refresh functionality**: Should reload data when refresh is clicked

### Test Edge Cases:
1. **No internet**: Should handle offline gracefully
2. **Corrupted data**: Should skip invalid entries
3. **Missing images**: Should show placeholder images
4. **Empty team names**: Should have fallback names
5. **Invalid timestamps**: Should handle date parsing errors

## 🚨 **Critical Requirements**
- **Handle missing or corrupted data gracefully**
- **Show meaningful error messages to users**
- **Preserve existing hunt functionality completely**
- **Ensure good performance even with many teams**

## 📝 **Notes**
- This integrates real data from your existing storage system
- Teams' actual photos will now appear in the feed
- Service should be resilient to data format changes
- Consider adding polling for real-time updates later