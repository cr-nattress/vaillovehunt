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