# Phase 6: Testing & Polish

## 🎯 **Objective**
Comprehensive testing, bug fixes, performance optimization, and final polish for the Feed feature. Ensure production-ready quality.

## 📋 **Prerequisites**
- Phase 1-5 must be completed and verified
- All Feed functionality should be working
- Auto-refresh and interactions should be functional

## 🔧 **Tasks**

### 1. Add Error Boundaries for Feed Components
Create `src/features/feed/components/FeedErrorBoundary.tsx`:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FeedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Feed Error Boundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Feed Error</h3>
          <p className="text-gray-500 mb-4">Something went wrong with the feed. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default FeedErrorBoundary
```

### 2. Add Feed Performance Monitoring
Create `src/features/feed/utils/performance.ts`:
```typescript
export class FeedPerformance {
  private static measurements: Map<string, number> = new Map()

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now())
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name)
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.delete(name)
    
    console.log(`📊 Feed Performance - ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  static measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startMeasurement(name)
    return asyncFn().finally(() => {
      this.endMeasurement(name)
    })
  }

  static logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('📊 Feed Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      })
    }
  }
}
```

### 3. Add Comprehensive Error Handling to FeedService
Update `src/features/feed/services/FeedService.ts`:
```typescript
export class FeedService {
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000

  static async getAllFeedPosts(): Promise<FeedPost[]> {
    return FeedPerformance.measureAsync('getAllFeedPosts', async () => {
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          console.log(`🔍 FeedService: Attempt ${attempt}/${this.MAX_RETRIES} - Fetching all team data...`)
          
          const allKeys = await this.getAllTeamKeys()
          console.log(`📊 Found ${allKeys.length} team keys`)
          
          if (allKeys.length === 0) {
            console.log('📭 No team keys found')
            return []
          }

          // Batch process team data to avoid overwhelming the system
          const batchSize = 5
          const teamDataResults: (TeamData | null)[] = []
          
          for (let i = 0; i < allKeys.length; i += batchSize) {
            const batch = allKeys.slice(i, i + batchSize)
            const batchPromises = batch.map(key => 
              this.getTeamData(key).catch(error => {
                console.warn(`⚠️ Failed to fetch data for ${key}:`, error)
                return null
              })
            )
            
            const batchResults = await Promise.all(batchPromises)
            teamDataResults.push(...batchResults)
          }

          const teamData = teamDataResults.filter(data => data !== null) as TeamData[]
          console.log(`✅ Successfully loaded ${teamData.length} teams`)
          
          // Transform team data into feed posts
          const allPosts: FeedPost[] = []
          
          for (const team of teamData) {
            try {
              const posts = this.transformTeamDataToPosts(team)
              allPosts.push(...posts)
            } catch (error) {
              console.warn(`⚠️ Failed to transform team data for ${team.teamName}:`, error)
            }
          }
          
          // Sort by timestamp (newest first)
          allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          
          console.log(`📸 Generated ${allPosts.length} feed posts`)
          FeedPerformance.logMemoryUsage()
          
          return allPosts

        } catch (error) {
          console.error(`❌ FeedService: Attempt ${attempt} failed:`, error)
          
          if (attempt < this.MAX_RETRIES) {
            console.log(`⏳ Retrying in ${this.RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt))
          } else {
            console.error('❌ FeedService: All retry attempts failed')
            throw new Error(`Failed to fetch feed posts after ${this.MAX_RETRIES} attempts: ${error.message}`)
          }
        }
      }
      
      return []
    })
  }

  // ... rest of existing methods with improved error handling
}
```

### 4. Add Feed Tests
Create `src/features/feed/components/__tests__/PostCard.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PostCard from '../PostCard'
import { FeedPost } from '../../types'

const mockPost: FeedPost = {
  id: 'test-1',
  teamName: 'Test Team',
  teamEmoji: '🏔️',
  locationName: 'Vail Village',
  stopTitle: 'Clock Tower',
  imageUrl: '/test-image.jpg',
  caption: 'Test caption',
  timestamp: new Date().toISOString(),
  reactions: { likes: 5, comments: 2, shares: 1 }
}

describe('PostCard', () => {
  it('renders post information correctly', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('Test Team')).toBeInTheDocument()
    expect(screen.getByText('Vail Village')).toBeInTheDocument()
    expect(screen.getByText('Clock Tower')).toBeInTheDocument()
    expect(screen.getByText('Test caption')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // likes count
  })

  it('handles like button click', () => {
    const onLike = vi.fn()
    render(<PostCard post={mockPost} onLike={onLike} />)
    
    const likeButton = screen.getByRole('button', { name: /like/i })
    fireEvent.click(likeButton)
    
    expect(onLike).toHaveBeenCalledWith('test-1')
    expect(screen.getByText('6')).toBeInTheDocument() // incremented likes
  })

  it('shows loading skeleton when isLoading is true', () => {
    render(<PostCard post={mockPost} isLoading={true} />)
    
    expect(screen.queryByText('Test Team')).not.toBeInTheDocument()
    // Should show skeleton elements with animate-pulse class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('handles image error correctly', () => {
    render(<PostCard post={mockPost} />)
    
    const image = screen.getByRole('img')
    fireEvent.error(image)
    
    expect(image).toHaveAttribute('src', '/images/placeholder-image.svg')
  })
})
```

### 5. Add Feed Integration Tests
Create `src/features/feed/services/__tests__/FeedService.test.ts`:
```typescript
import { FeedService } from '../FeedService'
import { DualWriteService } from '../../../../client/DualWriteService'

// Mock DualWriteService
vi.mock('../../../../client/DualWriteService', () => ({
  DualWriteService: {
    get: vi.fn()
  }
}))

describe('FeedService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transforms team data to feed posts correctly', async () => {
    const mockTeamData = {
      'team1-progress': {
        progress: {
          'stop1': {
            done: true,
            photo: 'http://example.com/photo1.jpg',
            notes: 'Great photo!',
            completedAt: '2023-12-01T10:00:00Z'
          }
        },
        teamName: 'Test Team',
        locationName: 'Vail',
        eventName: 'Hunt'
      }
    }

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        length: 1,
        key: vi.fn().mockReturnValue('team1-progress'),
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockTeamData['team1-progress'])),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })

    vi.mocked(DualWriteService.get).mockResolvedValue(mockTeamData['team1-progress'])

    const posts = await FeedService.getAllFeedPosts()

    expect(posts).toHaveLength(1)
    expect(posts[0]).toMatchObject({
      teamName: 'Test Team',
      locationName: 'Vail',
      stopTitle: 'Stop1',
      imageUrl: 'http://example.com/photo1.jpg',
      caption: 'Great photo!'
    })
  })

  it('handles errors gracefully', async () => {
    vi.mocked(DualWriteService.get).mockRejectedValue(new Error('Network error'))

    const posts = await FeedService.getAllFeedPosts()

    expect(posts).toEqual([])
    // Should not throw error
  })
})
```

### 6. Add Performance Optimizations
Update `src/features/feed/components/FeedPage.tsx`:
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FeedPerformance } from '../utils/performance'

export default function FeedPage({ onNavigate }: FeedPageProps) {
  // ... existing state ...

  // Memoize expensive operations
  const sortedPosts = useMemo(() => {
    return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [posts])

  // Optimize refresh function
  const loadFeedPosts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }
      setError(null)
      
      const feedPosts = await FeedService.getAllFeedPosts()
      setPosts(feedPosts)
      setLastRefresh(new Date())
      
    } catch (error) {
      console.error('❌ Failed to load feed posts:', error)
      if (!silent) {
        setError('Failed to load feed posts. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ... rest of component
}
```

### 7. Add Mobile Responsiveness Improvements
Update CSS for better mobile experience:
```css
/* Add to index.html style section */
@media (max-width: 640px) {
  .feed-header {
    padding: 0.75rem 1rem;
  }
  
  .post-card {
    margin-bottom: 0.75rem;
    border-radius: 0.5rem;
  }
  
  .post-actions {
    padding: 0.75rem 1rem;
  }
}

/* Improve touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Better pull-to-refresh feedback */
.pull-indicator {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 8. Add Accessibility Improvements
Update components with better accessibility:
```typescript
// Add to PostCard.tsx
<article 
  className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden"
  role="article"
  aria-labelledby={`post-title-${post.id}`}
  aria-describedby={`post-content-${post.id}`}
>
  <h3 id={`post-title-${post.id}`} className="sr-only">
    Post from {post.teamName} at {post.stopTitle}
  </h3>
  
  <div id={`post-content-${post.id}`} className="sr-only">
    {post.caption}
  </div>
  
  {/* ... existing content ... */}
</article>
```

## ✅ **Verification Steps**

### Test Error Handling:
1. **Network failures**: Disconnect internet and test graceful degradation
2. **Invalid data**: Test with corrupted localStorage data
3. **Memory leaks**: Check for memory leaks with repeated refreshes
4. **Error boundaries**: Trigger errors and verify recovery

### Test Performance:
1. **Large datasets**: Test with 50+ posts
2. **Image loading**: Test with slow/broken images
3. **Auto-refresh**: Verify no performance degradation over time
4. **Memory usage**: Monitor memory usage during extended use

### Test Accessibility:
1. **Screen readers**: Test with screen reader software
2. **Keyboard navigation**: Navigate entire feed with keyboard only
3. **Focus management**: Verify focus doesn't get lost
4. **Color contrast**: Test in high contrast mode

### Test Mobile Experience:
1. **Touch interactions**: Test all touch gestures work
2. **Pull-to-refresh**: Test on various mobile browsers
3. **Viewport sizes**: Test on different screen sizes
4. **Performance**: Test on slower mobile devices

## 🚨 **Critical Requirements**
- **No performance regressions** in existing hunt functionality
- **Graceful error handling** for all failure scenarios
- **Accessible to all users** including screen reader users
- **Production-ready code quality** with proper error boundaries

## 📝 **Notes**
- All tests should pass before considering this phase complete
- Performance monitoring should be enabled in development
- Error boundaries prevent crashes and provide user-friendly messages
- Mobile experience should feel native and responsive