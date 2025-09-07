import React, { useState, useEffect } from 'react'
import { PageType } from '../../../store/navigation.store'
import PostCard from './PostCard'
import FooterNav from '../../app/FooterNav'
import { FeedPost } from '../types'
import { FeedService } from '../services/FeedService'
import { useEventStore } from '../../../store/event.store'

interface FeedPageProps {
  onNavigate: (page: PageType) => void
  percent: number
  completeCount: number
  totalStops: number
}

export default function FeedPage({ onNavigate, percent, completeCount, totalStops }: FeedPageProps) {
  const { locationName, eventName, teamName } = useEventStore()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeedPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 Feed: Loading posts with filters:', { locationName, eventName, teamName })
      
      // Create filters to show all posts from same location/event (including current team)
      const filters = {
        locationName: locationName || undefined,
        eventName: eventName || undefined
      }
      
      const feedPosts = await FeedService.getAllFeedPosts(filters)
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
  }, [locationName, eventName, teamName]) // Reload when URL parameters change

  const handleRefresh = () => {
    loadFeedPosts()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main 
        className="max-w-screen-sm mx-auto px-4 py-5"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
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
            <p className="text-gray-500">{error}</p>
          </div>
        ) : posts.length > 0 ? (
          // Posts
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          // Enhanced Empty state
          <div className="text-center py-16 px-4">
            <div className="max-w-sm mx-auto">
              {/* Enhanced Icon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                backgroundColor: 'var(--color-light-pink)',
              }}>
                <svg className="w-12 h-12" style={{ color: 'var(--color-cabernet)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              
              {/* Enhanced Content */}
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-cabernet)' }}>
                Be the First to Share!
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                No teams have uploaded photos for <span className="font-medium">{locationName} - {eventName}</span> yet. 
                Start your scavenger hunt and be the first to share your adventure!
              </p>
              
              {/* Call to Action */}
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('hunt')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-cabernet)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-deep-wine)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-cabernet)'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Your Hunt
                </button>
                
                <p className="text-sm text-gray-500">
                  Complete challenges and upload photos to see them here
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Mobile Footer Navigation */}
      <FooterNav 
        activePage="social"
        progressPercent={percent}
        completeCount={completeCount}
        totalStops={totalStops}
        onEventClick={() => {
          // Navigate to event page
          onNavigate('event')
        }}
        onChallengesClick={() => {
          // Navigate to hunt/challenges page
          onNavigate('hunt')
        }}
        onSocialClick={() => {
          // Navigate to social/feed page - already here
          console.log('Already on social feed')
        }}
      />
    </div>
  )
}