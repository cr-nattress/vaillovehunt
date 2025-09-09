/**
 * Service Loading States - Phase 6 Frontend Integration
 * 
 * Reusable loading components for service operations with:
 * - Skeleton screens for different data types
 * - Progressive loading indicators
 * - Accessibility features
 * - Customizable styling
 */

import React from 'react'

// Base loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  color = 'var(--color-cabernet)',
  className = '' 
}: {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      style={{ color }}
      aria-hidden="true"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
        opacity="0.3"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
        strokeDasharray="15.708"
        strokeDashoffset="15.708"
        className="animate-spin"
      />
    </svg>
  )
}

// Skeleton loading for text content
export function TextSkeleton({ 
  lines = 3, 
  className = '',
  animated = true 
}: {
  lines?: number
  className?: string
  animated?: boolean
}) {
  const animationClass = animated ? 'animate-pulse' : ''
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${animationClass}`}
          style={{
            backgroundColor: 'var(--color-light-grey)',
            width: i === lines - 1 ? '75%' : '100%'
          }}
        />
      ))}
    </div>
  )
}

// Skeleton loading for cards
export function CardSkeleton({ 
  className = '',
  animated = true,
  showImage = true,
  showAction = true
}: {
  className?: string
  animated?: boolean
  showImage?: boolean
  showAction?: boolean
}) {
  const animationClass = animated ? 'animate-pulse' : ''
  
  return (
    <div 
      className={`border rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: 'var(--color-white)',
        borderColor: 'var(--color-light-grey)'
      }}
    >
      {/* Header skeleton */}
      <div className={`h-6 bg-gray-200 rounded mb-3 ${animationClass}`} style={{ backgroundColor: 'var(--color-light-grey)', width: '60%' }} />
      
      {/* Image skeleton */}
      {showImage && (
        <div 
          className={`w-full h-32 bg-gray-200 rounded mb-3 ${animationClass}`}
          style={{ backgroundColor: 'var(--color-light-grey)' }}
        />
      )}
      
      {/* Text content skeleton */}
      <div className="space-y-2 mb-4">
        <div className={`h-4 bg-gray-200 rounded ${animationClass}`} style={{ backgroundColor: 'var(--color-light-grey)' }} />
        <div className={`h-4 bg-gray-200 rounded ${animationClass}`} style={{ backgroundColor: 'var(--color-light-grey)', width: '80%' }} />
      </div>
      
      {/* Action button skeleton */}
      {showAction && (
        <div className={`h-10 bg-gray-200 rounded ${animationClass}`} style={{ backgroundColor: 'var(--color-light-grey)', width: '100px' }} />
      )}
    </div>
  )
}

// Loading state for event lists
export function EventListLoading({ 
  count = 3,
  className = '' 
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <TextSkeleton lines={1} className="w-32" />
        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
      </div>
      
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton 
          key={i}
          showImage={false}
          className="mb-4"
        />
      ))}
    </div>
  )
}

// Loading state for organization data
export function OrganizationLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Organization header */}
      <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-light-grey)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
          <div className="flex-1">
            <div className="w-48 h-8 bg-gray-200 rounded mb-2 animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="w-20 h-4 bg-gray-200 rounded mb-2 animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
          </div>
          <div>
            <div className="w-20 h-4 bg-gray-200 rounded mb-2 animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
          </div>
        </div>
      </div>
      
      {/* Hunt list */}
      <div className="space-y-4">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
        <EventListLoading count={2} />
      </div>
    </div>
  )
}

// Loading state for hunt details
export function HuntDetailsLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hunt header */}
      <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-light-grey)' }}>
        <div className="w-64 h-8 bg-gray-200 rounded mb-4 animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-4 bg-gray-200 rounded mb-1 animate-pulse mx-auto" style={{ backgroundColor: 'var(--color-light-grey)' }} />
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse mx-auto" style={{ backgroundColor: 'var(--color-light-grey)' }} />
            </div>
          ))}
        </div>
        <TextSkeleton lines={2} />
      </div>
      
      {/* Stops/Tasks list */}
      <div className="space-y-3">
        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="border rounded-lg p-4"
            style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-light-grey)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--color-light-grey)' }} />
              <div className="flex-1">
                <div className="w-40 h-5 bg-gray-200 rounded mb-2 animate-pulse" style={{ backgroundColor: 'var(--color-light-grey)' }} />
                <TextSkeleton lines={2} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Progressive loading with phases
export function ProgressiveLoader({
  phase,
  className = ''
}: {
  phase: 'initializing' | 'loading' | 'processing' | 'finalizing'
  className?: string
}) {
  const phases = {
    initializing: 'Getting ready...',
    loading: 'Loading data...',
    processing: 'Processing...',
    finalizing: 'Almost done...'
  }

  const progress = {
    initializing: 25,
    loading: 50,
    processing: 75,
    finalizing: 90
  }

  return (
    <div className={`text-center py-8 ${className}`}>
      <LoadingSpinner size="lg" className="mb-4 mx-auto" />
      
      {/* Progress bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--color-light-grey)' }}>
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--color-cabernet)',
            width: `${progress[phase]}%`
          }}
        />
      </div>
      
      {/* Status text */}
      <p className="text-sm" style={{ color: 'var(--color-medium-grey)' }}>
        {phases[phase]}
      </p>
    </div>
  )
}

// Inline loading indicator for buttons
export function ButtonLoading({ 
  size = 'sm',
  text = 'Loading...',
  className = ''
}: {
  size?: 'sm' | 'md'
  text?: string
  className?: string
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span>{text}</span>
    </span>
  )
}

// Service health loading indicator
export function ServiceHealthLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
            style={{ 
              backgroundColor: 'var(--color-light-grey)',
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'var(--color-medium-grey)' }}>
        Checking service health...
      </span>
    </div>
  )
}

// Accessibility-focused loading announcement
export function LoadingAnnouncement({ 
  message = 'Loading content, please wait',
  className = ''
}: {
  message?: string
  className?: string
}) {
  return (
    <div 
      className={`sr-only ${className}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  )
}