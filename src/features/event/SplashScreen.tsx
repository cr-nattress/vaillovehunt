import React, { useEffect, useState } from 'react'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'

interface SplashScreenProps {
  onSelectEvent: (evt: OrgEvent, teamName?: string) => void
  onSetupNew: () => void
  onClose?: () => void
}

// Mock team data
const MOCK_TEAMS = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']

export default function SplashScreen({ onSelectEvent, onSetupNew, onClose }: SplashScreenProps) {
  const [events, setEvents] = useState<OrgEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [step, setStep] = useState<'events' | 'teams'>('events')

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

  const handleEventSelect = (evt: OrgEvent) => {
    setSelectedEvent(evt)
    setStep('teams')
  }

  const handleTeamSelect = (teamName: string) => {
    if (selectedEvent) {
      onSelectEvent(selectedEvent, teamName)
    }
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setStep('events')
  }

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
              <div className="flex items-center gap-3">
                {step === 'teams' && (
                  <button
                    onClick={handleBackToEvents}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Back to events"
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-semibold">
                  {step === 'events' ? "Today's Scavenger Hunts" : "Select Your Team"}
                </h2>
              </div>
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
            <p className="text-sm text-gray-600 mt-1">
              {step === 'events' 
                ? "Select a scavenger hunt to join today's adventure!" 
                : `Choose your team for ${selectedEvent?.eventName} - ${selectedEvent?.orgName}`
              }
            </p>

            <div className="mt-4">
              {step === 'events' && (
                <>
                  {loading && (
                    <div className="text-gray-700">Loading today\'s events…</div>
                  )}
                  {error && (
                    <div className="text-red-700">{error}</div>
                  )}
                  {!loading && !error && (
                    <>
                      {events && events.length > 0 ? (
                        <ul className="space-y-3">
                          {events.map((evt) => (
                            <li key={evt.key}>
                              <button 
                                className="w-full text-left p-4 border rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                                style={{ borderColor: 'var(--color-light-grey)' }}
                                onClick={() => handleEventSelect(evt)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-lg mb-1" style={{ color: 'var(--color-cabernet)' }}>
                                      {evt.eventName}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                      Hosted by {evt.orgName}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>Today's Hunt</span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div 
                                      className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                                      style={{ backgroundColor: 'var(--color-light-pink)' }}
                                    >
                                      <svg className='w-5 h-5' style={{ color: 'var(--color-cabernet)' }} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-gray-700">No scavenger hunts scheduled for today</div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {step === 'teams' && (
                <div className="space-y-3">
                  {MOCK_TEAMS.map((teamName) => (
                    <button
                      key={teamName}
                      onClick={() => handleTeamSelect(teamName)}
                      className="w-full p-4 border rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                      style={{ borderColor: 'var(--color-light-grey)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                            style={{ 
                              backgroundColor: teamName.toLowerCase() === 'red' ? '#DC2626' :
                                              teamName.toLowerCase() === 'green' ? '#16A34A' :
                                              teamName.toLowerCase() === 'blue' ? '#2563EB' :
                                              teamName.toLowerCase() === 'yellow' ? '#CA8A04' :
                                              teamName.toLowerCase() === 'orange' ? '#EA580C' : 
                                              'var(--color-cabernet)'
                            }}
                          >
                            {teamName.charAt(0)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-lg" style={{ color: 'var(--color-cabernet)' }}>
                              Team {teamName}
                            </div>
                            <div className="text-sm text-gray-600">
                              Join the {teamName.toLowerCase()} team
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: 'var(--color-light-pink)' }}
                          >
                            <svg className='w-5 h-5' style={{ color: 'var(--color-cabernet)' }} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {step === 'events' && (
              <div className="mt-5">
                <button
                  onClick={onSetupNew}
                  className="w-full px-4 py-3 text-white font-medium rounded-md"
                  style={{ backgroundColor: 'var(--color-cabernet)' }}
                >
                  Set up a new event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
