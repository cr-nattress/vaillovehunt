import React, { useState } from 'react'
import { PageType } from '../../store/appStore'
import { useAppStore } from '../../store/appStore'
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
    setEventName 
  } = useAppStore()
  
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
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
            {!lockedByQuery && (
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsEditMode(!isEditMode)
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
                aria-label={`${isEditMode ? 'Close' : 'Open'} settings panel to change location and team information`}
                aria-expanded={isEditMode}
                aria-controls="settings-panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            
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