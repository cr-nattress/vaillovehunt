# Phase 5: Feed Enhancements

## 🎯 **Objective**
Add polish and advanced features to the Feed page including auto-refresh, better interactions, performance optimizations, and improved user experience.

## 📋 **Prerequisites**
- Phase 1-4 must be completed and verified
- Feed should show real team data successfully
- All basic functionality should work correctly

## 🔧 **Tasks**

### 1. Add Auto-Refresh Functionality
Update `src/features/feed/components/FeedPage.tsx`:
```typescript
export default function FeedPage({ onNavigate }: FeedPageProps) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadFeedPosts = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }
      setError(null)
      
      const feedPosts = await FeedService.getAllFeedPosts()
      setPosts(feedPosts)
      setLastRefresh(new Date())
      
      if (feedPosts.length === 0) {
        console.log('📭 No feed posts found - teams may not have uploaded photos yet')
      }
      
    } catch (error) {
      console.error('❌ Failed to load feed posts:', error)
      if (!silent) {
        setError('Failed to load feed posts. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing feed...')
      loadFeedPosts(true) // Silent refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    loadFeedPosts()
  }, [])

  const handleRefresh = () => {
    loadFeedPosts(false)
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  // ... rest of component
}
```

### 2. Enhanced Feed Header with Controls
Update `src/features/feed/components/FeedHeader.tsx`:
```typescript
interface FeedHeaderProps {
  onNavigate: (page: PageType) => void
  onRefresh?: () => void
  autoRefresh?: boolean
  onToggleAutoRefresh?: () => void
  lastRefresh?: Date
  postsCount?: number
}

export default function FeedHeader({ 
  onNavigate, 
  onRefresh, 
  autoRefresh = false, 
  onToggleAutoRefresh,
  lastRefresh,
  postsCount = 0
}: FeedHeaderProps) {
  const formatLastRefresh = (date?: Date) => {
    if (!date) return ''
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className="sticky top-16 z-10 bg-white border-b border-gray-200">
      {/* Main header */}
      <div className="px-4 py-3">
        <div className="max-w-screen-sm mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('hunt')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to Hunt"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Team Feed</h1>
              <p className="text-sm text-gray-500">
                {postsCount > 0 ? `${postsCount} posts` : 'Latest photos from all teams'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <button
              onClick={onToggleAutoRefresh}
              className={`p-2 rounded-full transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            
            {/* Manual refresh button */}
            <button 
              onClick={onRefresh}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={!onRefresh}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="max-w-screen-sm mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Updated {formatLastRefresh(lastRefresh)}</span>
            {autoRefresh && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
          <div>
            Pull down to refresh
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Add Image Lightbox Modal
Create `src/features/feed/components/ImageModal.tsx`:
```typescript
import React, { useEffect } from 'react'

interface ImageModalProps {
  imageUrl: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export default function ImageModal({ imageUrl, alt, isOpen, onClose }: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
          aria-label="Close image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
```

### 4. Enhanced PostCard with Interactions
Update `src/features/feed/components/PostCard.tsx`:
```typescript
import React, { useState } from 'react'
import { FeedPost } from '../types'
import ImageModal from './ImageModal'

interface PostCardProps {
  post: FeedPost
  isLoading?: boolean
  onLike?: (postId: string) => void
}

export default function PostCard({ post, isLoading = false, onLike }: PostCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.reactions?.likes || 0)

  if (isLoading) {
    return <PostCardSkeleton />
  }

  const handleLike = () => {
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
    
    if (onLike) {
      onLike(post.id)
    }
  }

  const handleImageClick = () => {
    setImageModalOpen(true)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <>
      <article className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
        {/* Post Header */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
            {post.teamEmoji}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{post.teamName}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{post.locationName}</span>
              <span>•</span>
              <span>{formatTimeAgo(post.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Post Image - Clickable */}
        <div className="relative aspect-square bg-gray-100 cursor-pointer" onClick={handleImageClick}>
          <img 
            src={post.imageUrl} 
            alt={`${post.teamName} at ${post.stopTitle}`}
            className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder-image.svg'
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
            <p className="text-white text-sm font-medium">{post.stopTitle}</p>
          </div>
          
          {/* Zoom indicator */}
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>

        {/* Post Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-gray-900 text-sm leading-relaxed">{post.caption}</p>
          </div>
        )}

        {/* Post Actions */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className={`flex items-center gap-2 transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isLiked ? 'scale-110' : ''}`} 
                fill={isLiked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{likeCount}</span>
            </button>
            
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{post.reactions.comments}</span>
            </div>
          </div>
          
          {/* Share button */}
          <button className="text-gray-500 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </article>

      {/* Image Modal */}
      <ImageModal
        imageUrl={post.imageUrl}
        alt={`${post.teamName} at ${post.stopTitle}`}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />
    </>
  )
}

// ... existing PostCardSkeleton component
```

### 5. Add Pull-to-Refresh
Update `src/features/feed/components/FeedPage.tsx` to include pull-to-refresh:
```typescript
export default function FeedPage({ onNavigate }: FeedPageProps) {
  // ... existing state ...
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  // Pull-to-refresh handlers
  const handleTouchStart = useRef<{ y: number; pulling: boolean }>({ y: 0, pulling: false })

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      handleTouchStart.current = { y: e.touches[0].clientY, pulling: true }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!handleTouchStart.current.pulling) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - handleTouchStart.current.y
    
    if (distance > 0 && distance < 100) {
      setPullDistance(distance)
      setIsPulling(true)
      e.preventDefault()
    }
  }

  const onTouchEnd = () => {
    if (isPulling && pullDistance > 60) {
      loadFeedPosts(false) // Trigger refresh
    }
    
    setIsPulling(false)
    setPullDistance(0)
    handleTouchStart.current = { y: 0, pulling: false }
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <FeedHeader 
        onNavigate={onNavigate} 
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        lastRefresh={lastRefresh}
        postsCount={posts.length}
      />
      
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-16 left-0 right-0 z-10 bg-blue-50 border-b border-blue-200 transition-transform duration-300"
          style={{ 
            transform: `translateY(${Math.min(pullDistance - 60, 40)}px)`,
            opacity: Math.min(pullDistance / 60, 1)
          }}
        >
          <div className="max-w-screen-sm mx-auto px-4 py-2 flex items-center justify-center gap-2 text-blue-600">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Pull to refresh</span>
          </div>
        </div>
      )}
      
      <main className="max-w-screen-sm mx-auto px-4 py-4">
        {/* ... existing content ... */}
      </main>
    </div>
  )
}
```

## ✅ **Verification Steps**

### Test Enhanced Features:
1. **Auto-refresh**: Should update feed every 30 seconds automatically
2. **Manual refresh**: Refresh button should work instantly
3. **Live indicator**: Should show green dot when auto-refresh is on
4. **Image modal**: Clicking images should open full-screen view
5. **Like interactions**: Heart button should animate and update count
6. **Pull-to-refresh**: Should work on mobile devices

### Test Performance:
1. **Smooth scrolling**: Should scroll smoothly with many posts
2. **Image loading**: Should lazy load images efficiently
3. **Memory usage**: Should not leak memory on refresh
4. **Background updates**: Should not interrupt user interactions

### Test Accessibility:
1. **Keyboard navigation**: Should work with tab/enter keys
2. **Screen readers**: Should announce updates properly
3. **Focus management**: Should maintain focus correctly
4. **Alt text**: Images should have descriptive alt text

## 🚨 **Critical Requirements**
- **Maintain excellent performance** even with frequent updates
- **Don't interrupt user interactions** during auto-refresh
- **Preserve scroll position** during background updates
- **Handle network failures** gracefully

## 📝 **Notes**
- Auto-refresh is non-intrusive and runs in background
- Image modal provides better photo viewing experience
- Pull-to-refresh follows mobile app conventions
- All interactions provide immediate visual feedback