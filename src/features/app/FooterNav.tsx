import React, { useState, useEffect } from 'react'

interface FooterNavProps {
  onEventClick?: () => void
  onChallengesClick?: () => void
  onSocialClick?: () => void
  // State awareness flags
  eventEnabled?: boolean
  challengesEnabled?: boolean
  socialEnabled?: boolean
  // Active state for navigation
  activePage?: 'event' | 'challenges' | 'social'
  // Progress indication
  progressPercent?: number
  completeCount?: number
  totalStops?: number
}

export default function FooterNav({ 
  onEventClick, 
  onChallengesClick, 
  onSocialClick,
  eventEnabled = true,
  challengesEnabled = true,
  socialEnabled = true,
  activePage,
  progressPercent = 0,
  completeCount = 0,
  totalStops = 0
}: FooterNavProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // Basic heuristic for virtual keyboard detection on mobile
      if (window.innerWidth < 768) {
        const currentHeight = window.innerHeight
        const initialHeight = window.screen.height
        const heightDiff = initialHeight - currentHeight
        setIsKeyboardVisible(heightDiff > 150) // Threshold for keyboard
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <footer 
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        isKeyboardVisible ? 'md:transform-none transform translate-y-full' : ''
      }`}
      style={{
        backgroundColor: 'var(--color-white)',
        borderTopColor: 'var(--color-light-grey)',
        paddingBottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom)',
        boxShadow: window.innerWidth >= 768 
          ? '0 -1px 4px rgba(0, 0, 0, 0.05)' 
          : '0 -2px 8px rgba(0, 0, 0, 0.1)'
      }}
      role="contentinfo"
      aria-label="Mobile navigation footer"
    >
      {/* Progress Bar */}
      {totalStops > 0 && (
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: 'var(--color-cabernet)'
            }}
          />
        </div>
      )}
      
      <div className="border-t" style={{ borderTopColor: 'var(--color-light-grey)' }}>
        <nav 
          role="navigation" 
          className="flex items-center justify-around px-4 py-3 md:px-8 md:py-4 lg:max-w-4xl lg:mx-auto" 
          aria-label="Main navigation"
        >
          {/* Event Button */}
          <button
            onClick={eventEnabled ? (onEventClick || (() => console.log('Event clicked'))) : undefined}
            disabled={!eventEnabled}
            className="flex flex-col items-center gap-1 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 min-w-0 flex-1 md:max-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{
              color: activePage === 'event' ? 'var(--color-cabernet)' : (eventEnabled ? 'var(--color-medium-grey)' : 'var(--color-light-grey)'),
              backgroundColor: activePage === 'event' ? 'var(--color-light-pink)' : 'transparent',
              cursor: eventEnabled ? 'pointer' : 'not-allowed',
              opacity: eventEnabled ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (eventEnabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-light-pink)'
                e.currentTarget.style.color = 'var(--color-cabernet)'
              }
            }}
            onMouseLeave={(e) => {
              if (eventEnabled) {
                e.currentTarget.style.backgroundColor = activePage === 'event' ? 'var(--color-light-pink)' : 'transparent'
                e.currentTarget.style.color = activePage === 'event' ? 'var(--color-cabernet)' : 'var(--color-medium-grey)'
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && eventEnabled) {
                e.preventDefault()
                onEventClick?.()
              }
            }}
            aria-label="Navigate to event information and details"
            role="button"
            tabIndex={0}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-xs font-medium truncate">Event</span>
          </button>

          {/* Challenges Button */}
          <button
            onClick={challengesEnabled ? (onChallengesClick || (() => console.log('Challenges clicked'))) : undefined}
            disabled={!challengesEnabled}
            className="flex flex-col items-center gap-1 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 min-w-0 flex-1 md:max-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{
              color: activePage === 'challenges' ? 'var(--color-cabernet)' : (challengesEnabled ? 'var(--color-medium-grey)' : 'var(--color-light-grey)'),
              backgroundColor: activePage === 'challenges' ? 'var(--color-light-pink)' : 'transparent',
              cursor: challengesEnabled ? 'pointer' : 'not-allowed',
              opacity: challengesEnabled ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (challengesEnabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-light-pink)'
                e.currentTarget.style.color = 'var(--color-cabernet)'
              }
            }}
            onMouseLeave={(e) => {
              if (challengesEnabled) {
                e.currentTarget.style.backgroundColor = activePage === 'challenges' ? 'var(--color-light-pink)' : 'transparent'
                e.currentTarget.style.color = activePage === 'challenges' ? 'var(--color-cabernet)' : 'var(--color-medium-grey)'
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && challengesEnabled) {
                e.preventDefault()
                onChallengesClick?.()
              }
            }}
            aria-label="Navigate to hunt challenges and scavenger hunt activities"
            role="button"
            tabIndex={0}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
              />
            </svg>
            <span className="text-xs font-medium truncate">Challenges</span>
          </button>

          {/* Social Button */}
          <button
            onClick={socialEnabled ? (onSocialClick || (() => console.log('Social clicked'))) : undefined}
            disabled={!socialEnabled}
            className="flex flex-col items-center gap-1 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 min-w-0 flex-1 md:max-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{
              color: activePage === 'social' ? 'var(--color-cabernet)' : (socialEnabled ? 'var(--color-medium-grey)' : 'var(--color-light-grey)'),
              backgroundColor: activePage === 'social' ? 'var(--color-light-pink)' : 'transparent',
              cursor: socialEnabled ? 'pointer' : 'not-allowed',
              opacity: socialEnabled ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (socialEnabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-light-pink)'
                e.currentTarget.style.color = 'var(--color-cabernet)'
              }
            }}
            onMouseLeave={(e) => {
              if (socialEnabled) {
                e.currentTarget.style.backgroundColor = activePage === 'social' ? 'var(--color-light-pink)' : 'transparent'
                e.currentTarget.style.color = activePage === 'social' ? 'var(--color-cabernet)' : 'var(--color-medium-grey)'
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && socialEnabled) {
                e.preventDefault()
                onSocialClick?.()
              }
            }}
            aria-label="Navigate to social feed and photo sharing"
            role="button"
            tabIndex={0}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <span className="text-xs font-medium truncate">Social</span>
          </button>
        </nav>
      </div>
    </footer>
  )
}