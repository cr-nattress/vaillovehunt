import React, { useEffect, useState } from 'react'
import { PageType } from '../../store/navigation.store'
import { useAppStore } from '../../store/appStore'
import { useNavigationStore } from '../../store/navigation.store'
import { useEventStore } from '../../store/event.store'
import FooterNav from '../app/FooterNav'
import ProgressGauge from '../../components/ProgressGauge'
import SettingsPanel from '../app/SettingsPanel'
import { slugify } from '../../utils/slug'

interface EventPageProps {
  onNavigate: (page: PageType) => void
  completeCount: number
  totalStops: number
  percent: number
  stops: any[]
  progress: any
  onSaveSettings: () => void
}

export default function EventPage({ 
  onNavigate, 
  completeCount, 
  totalStops, 
  percent, 
  stops, 
  progress, 
  onSaveSettings 
}: EventPageProps) {
  const { 
    locationName, 
    teamName, 
    eventName, 
    lockedByQuery,
    setLocationName, 
    setTeamName, 
    setEventName,
    openEventSettingsOnce,
    clearOpenEventSettings
  } = useEventStore()
  
  const [isEditMode, setIsEditMode] = useState(false)

  // Auto-open settings when requested by other parts of the app (one-time)
  useEffect(() => {
    if (openEventSettingsOnce) {
      setIsEditMode(false)
      // Clear the intent flag after opening
      clearOpenEventSettings()
    }
  }, [openEventSettingsOnce])

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <main 
        className="max-w-screen-sm mx-auto px-4 py-5"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        {/* Event Information Card */}
        <section className='border rounded-lg shadow-sm p-4 relative' style={{
          backgroundColor: 'var(--color-white)',
          borderColor: 'var(--color-light-grey)'
        }} aria-labelledby="location-heading">
          <div className='flex items-center gap-2'>
            <h2 id="location-heading" className='text-xl font-semibold'>{locationName}</h2>
            
            {/* Copy Link button */}
            <button
              onClick={async () => {
                try {
                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                  const loc = slugify(locationName || '')
                  const evt = slugify(eventName || '')
                  const team = slugify(teamName || '')
                  const path = `/${loc}/${evt}/${team}`
                  const url = `${origin}${path}`
                  await navigator.clipboard.writeText(url)
                  console.log('Link copied to clipboard ✨')
                } catch (err) {
                  console.warn('Failed to copy link', err)
                  console.error('Failed to copy link to clipboard')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  ;(e.target as HTMLElement).click()
                }
              }}
              className='p-3 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-opacity-50'
              style={{
                color: 'var(--color-warm-grey)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-cabernet)'
                e.currentTarget.style.backgroundColor = 'var(--color-light-pink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-warm-grey)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onFocus={(e) => {
                e.currentTarget.style.color = 'var(--color-cabernet)'
                e.currentTarget.style.backgroundColor = 'var(--color-light-pink)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.color = 'var(--color-warm-grey)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label='Copy shareable link to clipboard'
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-2 2a4 4 0 11-5.656-5.656l1-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 010-5.656l2-2a4 4 0 115.656 5.656l-1 1" />
              </svg>
            </button>
          </div>
          
          {isEditMode ? (
            <SettingsPanel
              locationName={locationName}
              teamName={teamName}
              eventName={eventName}
              onChangeLocation={setLocationName}
              onChangeTeam={setTeamName}
              onChangeEvent={setEventName}
              onSave={() => {
                onSaveSettings()
                setIsEditMode(false)
              }}
              onCancel={() => setIsEditMode(false)}
            />
          ) : (
            <>
              {teamName && (
                <p className='text-blue-600 text-sm font-medium mt-2'>Team: {teamName}</p>
              )}
              
              {percent === 100 ? (
                <div className='mt-2' role="alert" aria-live="assertive">
                  <p className='text-lg font-semibold' style={{color: 'var(--color-cabernet)'}}>
                    <span role="img" aria-label="Party celebration">🎉</span> 
                    Congratulations! You completed the scavenger hunt.
                  </p>
                  <p className="sr-only">
                    All {completeCount} stops have been completed successfully. Well done!
                  </p>
                </div>
              ) : (
                <>
                  {/* Enhanced Progress Gauge */}
                  <ProgressGauge 
                    percent={percent}
                    completeCount={completeCount}
                    totalStops={totalStops}
                    stops={stops}
                    progress={progress}
                  />
                </>
              )}
            </>
          )}
        </section>

        {/* Event Details */}
        <section className='mt-4 border rounded-lg shadow-sm p-4' style={{
          backgroundColor: 'var(--color-white)',
          borderColor: 'var(--color-light-grey)'
        }}>
          <h3 className='text-lg font-semibold mb-3'>Event Details</h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='font-medium'>Event:</span>
              <span>{eventName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Location:</span>
              <span>{locationName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Team:</span>
              <span>{teamName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Progress:</span>
              <span>{completeCount}/{totalStops} stops ({percent}%)</span>
            </div>
          </div>
        </section>
      </main>
      
      {/* Mobile Footer Navigation */}
      <FooterNav 
        activePage="event"
        progressPercent={percent}
        completeCount={completeCount}
        totalStops={totalStops}
        onEventClick={() => {
          // Already on event page
          console.log('Already on event page')
        }}
        onChallengesClick={() => {
          // Navigate to hunt/challenges page
          onNavigate('hunt')
        }}
        onSocialClick={() => {
          // Navigate to social/feed page
          onNavigate('feed')
        }}
      />
    </div>
  )
}