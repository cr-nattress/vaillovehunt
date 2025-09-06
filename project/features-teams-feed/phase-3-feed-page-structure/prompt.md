# Phase 3: Feed Page Structure

## 🎯 **Objective**
Create the basic Feed page component structure and layout without any data integration. Focus on UI components and responsive design.

## 📋 **Prerequisites**
- Phase 1 & 2 must be completed and verified
- Navigation between Hunt and Feed should work smoothly
- Feed menu item should be visible and functional

## 🔧 **Tasks**

### 1. Create Feed Directory Structure
Create the following files:
```
src/features/feed/
├── components/
│   ├── FeedPage.tsx
│   ├── PostCard.tsx
│   └── FeedHeader.tsx
└── types/
    └── index.ts
```

### 2. Define Feed Types
Create `src/features/feed/types/index.ts`:
```typescript
export interface FeedPost {
  id: string
  teamName: string
  teamEmoji: string
  locationName: string
  stopTitle: string
  imageUrl: string
  caption: string
  timestamp: string
  reactions: {
    likes: number
    comments: number
    shares: number
  }
}

export interface TeamInfo {
  name: string
  emoji: string
  color: string
}
```

### 3. Create Feed Header Component
Create `src/features/feed/components/FeedHeader.tsx`:
```typescript
import React from 'react'
import { PageType } from '../../../hooks/useHashRouter'

interface FeedHeaderProps {
  onNavigate: (page: PageType) => void
}

export default function FeedHeader({ onNavigate }: FeedHeaderProps) {
  return (
    <div className="sticky top-16 z-10 bg-white border-b border-gray-200 px-4 py-3">
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
            <p className="text-sm text-gray-500">Latest photos from all teams</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 4. Create Post Card Component
Create `src/features/feed/components/PostCard.tsx`:
```typescript
import React from 'react'
import { FeedPost } from '../types'

interface PostCardProps {
  post: FeedPost
  isLoading?: boolean
}

export default function PostCard({ post, isLoading = false }: PostCardProps) {
  if (isLoading) {
    return <PostCardSkeleton />
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

      {/* Post Image */}
      <div className="relative aspect-square bg-gray-100">
        <img 
          src={post.imageUrl} 
          alt={`${post.teamName} at ${post.stopTitle}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder-image.svg'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
          <p className="text-white text-sm font-medium">{post.stopTitle}</p>
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
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{post.reactions.likes}</span>
          </button>
          
          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{post.reactions.comments}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// Loading skeleton component
function PostCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden animate-pulse">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      <div className="aspect-square bg-gray-200"></div>
      <div className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex gap-6">
        <div className="h-5 bg-gray-200 rounded w-12"></div>
        <div className="h-5 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  )
}
```

### 5. Create Main Feed Page Component
Create `src/features/feed/components/FeedPage.tsx`:
```typescript
import React, { useState } from 'react'
import { PageType } from '../../../hooks/useHashRouter'
import FeedHeader from './FeedHeader'
import PostCard from './PostCard'
import { FeedPost } from '../types'

interface FeedPageProps {
  onNavigate: (page: PageType) => void
}

// Mock data for now (will be replaced with real data in Phase 4)
const MOCK_POSTS: FeedPost[] = [
  {
    id: '1',
    teamName: 'Team Rockies',
    teamEmoji: '🏔️',
    locationName: 'Vail Village',
    stopTitle: 'Clock Tower',
    imageUrl: '/images/placeholder-image.svg',
    caption: 'Found the famous clock tower! Perfect spot for a team photo 📸',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    reactions: { likes: 12, comments: 3, shares: 2 }
  },
  {
    id: '2',
    teamName: 'Team Alpine',
    teamEmoji: '🎿',
    locationName: 'Vail Valley',
    stopTitle: 'International Bridge',
    imageUrl: '/images/placeholder-image.svg',
    caption: 'Amazing sunset view from the bridge! 🌅',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    reactions: { likes: 8, comments: 1, shares: 4 }
  }
]

export default function FeedPage({ onNavigate }: FeedPageProps) {
  const [posts] = useState<FeedPost[]>(MOCK_POSTS)
  const [isLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader onNavigate={onNavigate} />
      
      <main className="max-w-screen-sm mx-auto px-4 py-4">
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            <PostCard post={{} as FeedPost} isLoading={true} />
            <PostCard post={{} as FeedPost} isLoading={true} />
            <PostCard post={{} as FeedPost} isLoading={true} />
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
            <p className="text-gray-500">Be the first team to share a photo!</p>
          </div>
        )}
      </main>
    </div>
  )
}
```

### 6. Update App.jsx to Use Feed Page
Replace the Feed placeholder in `src/App.jsx`:
```jsx
import FeedPage from './features/feed/components/FeedPage'

// Replace the feed section with:
{currentPage === 'feed' && (
  <FeedPage onNavigate={navigateToPage} />
)}
```

## ✅ **Verification Steps**

### Test Feed Page Structure:
1. **Navigation to Feed**: Should show proper Feed page layout
2. **Back button**: Should navigate back to Hunt page
3. **Mock posts**: Should display sample posts with proper formatting
4. **Loading states**: Loading skeletons should animate
5. **Empty state**: Should show when no posts (test by making MOCK_POSTS empty)
6. **Responsive design**: Should look good on mobile and desktop

### Test Components:
1. **FeedHeader**: Sticky positioning, back button works
2. **PostCard**: Shows team info, image, caption, reactions
3. **Time formatting**: Should show "2m ago", "15m ago" etc.
4. **Image error handling**: Should show placeholder on broken images

### Test Styling:
1. **Consistent with app**: Should match existing design system
2. **Colors and spacing**: Should use proper CSS variables
3. **Typography**: Should be readable and consistent
4. **Mobile responsive**: Should work on various screen sizes

## 🚨 **Critical Requirements**
- **No real data integration yet** (that's Phase 4)
- **Use mock data only** for now
- **Focus on UI and layout** perfection
- **Maintain app's visual consistency**

## 📝 **Notes**
- Mock data simulates realistic posts
- Components are ready for real data integration
- Focus on responsive design and accessibility
- Keep loading states smooth and polished