import React, { useEffect, useState } from 'react'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'

interface SplashScreenProps {
  onSelectEvent: (evt: OrgEvent) => void
  onSetupNew: () => void
  onClose?: () => void
}

export default function SplashScreen({ onSelectEvent, onSetupNew, onClose }: SplashScreenProps) {
  const [events, setEvents] = useState<OrgEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const items = await fetchTodaysEvents()
        if (!mounted) return
        setEvents(items)
      } catch (e: any) {
        console.warn('Failed to load today\'s events', e)
        if (!mounted) return
        setError('Failed to load events')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
      />
      <div 
        className="absolute inset-x-0 top-0 mx-auto max-w-screen-sm p-4"
        style={{ animation: 'fadeInSlide 0.25s ease-out forwards' }}
      >
        <div 
          className="rounded-2xl shadow-xl border"
          style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-light-grey)' }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Welcome</h2>
              {onClose && (
                <button
                  className="p-2 rounded-lg"
                  aria-label="Close"
                  onClick={onClose}
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Choose your organization for today\'s event, or set up a new one.</p>

            <div className="mt-4">
              {loading && (
                <div className="text-gray-700">Loading today\'s events…</div>
              )}
              {error && (
                <div className="text-red-700">{error}</div>
              )}
              {!loading && !error && (
                <>
                  {events && events.length > 0 ? (
                    <ul className="space-y-2">
                      {events.map((evt) => (
                        <li key={evt.key}>
                          <button 
                            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                            style={{ borderColor: 'var(--color-light-grey)' }}
                            onClick={() => onSelectEvent(evt)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{evt.orgName}</div>
                                <div className="text-xs text-gray-600">Event: {evt.eventName}</div>
                              </div>
                              <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                              </svg>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-700">No events found for today.</div>
                  )}
                </>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={onSetupNew}
                className="w-full px-4 py-3 text-white font-medium rounded-md"
                style={{ backgroundColor: 'var(--color-cabernet)' }}
              >
                Set up a new event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
