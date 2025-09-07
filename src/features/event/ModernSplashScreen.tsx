import React, { useEffect, useState } from 'react'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'
import MountainLogo from '../../components/MountainLogo'

interface ModernSplashScreenProps {
  onSelectEvent: (evt: OrgEvent, teamName?: string) => void
  onSetupNew: () => void
  onClose?: () => void
}

// Mock team data
const MOCK_TEAMS = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']

export default function ModernSplashScreen({ onSelectEvent, onSetupNew, onClose }: ModernSplashScreenProps) {
  const [events, setEvents] = useState<OrgEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [step, setStep] = useState<'events' | 'teams' | 'form'>('events')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

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
    setSelectedTeam(teamName)
    setStep('form')
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setSelectedTeam(null)
    setStep('events')
  }

  const handleBackToTeams = () => {
    setSelectedTeam(null)
    setStep('teams')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEvent && selectedTeam) {
      // You could pass the form data here if needed
      console.log('User info:', formData)
      onSelectEvent(selectedEvent, selectedTeam)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modern-splash-screen">
      {/* Background with Disney+ style gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(85, 36, 72, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(234, 227, 212, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, 
              rgba(85, 36, 72, 0.9) 0%, 
              rgba(107, 48, 87, 0.8) 25%,
              rgba(68, 29, 57, 0.9) 50%,
              rgba(85, 36, 72, 0.95) 100%
            )
          `
        }}
      />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      

      {/* Main content container */}
      <div className="relative z-10 h-full flex flex-col max-w-2xl mx-auto p-4 sm:p-8 text-center">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0">
          {/* Logo section */}
          <div className="mb-6 scale-in-animation">
            <MountainLogo size="lg" animated className="mx-auto mb-4" />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Vail Hunt
              </h1>
              <p className="text-base sm:text-lg font-light tracking-wide" style={{ color: 'var(--color-cream)' }}>
                Mountain Adventure Awaits
              </p>
            </div>
          </div>

          {/* Welcome message */}
          <div className="mb-6 fade-in-up-animation" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              {(step === 'teams' || step === 'form') && (
                <button
                  onClick={step === 'teams' ? handleBackToEvents : handleBackToTeams}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 group"
                  aria-label={step === 'teams' ? 'Back to events' : 'Back to teams'}
                >
                  <svg className='w-4 h-4 group-hover:-translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {step === 'events' ? 'Welcome to Your Adventure' : 
                 step === 'teams' ? 'Select Your Team' : 
                 'Enter Your Information'}
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed max-w-md mx-auto px-2" style={{ color: 'rgba(234, 227, 212, 0.9)' }}>
              {step === 'events' 
                ? 'Choose your organization for today\'s event, or set up a new mountain expedition.'
                : step === 'teams'
                ? `Choose your team for ${selectedEvent?.eventName} - ${selectedEvent?.orgName}`
                : `Complete your registration for Team ${selectedTeam} - ${selectedEvent?.eventName}`
              }
            </p>
          </div>
        </div>

        {/* Flexible Content Section */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up-animation" style={{ animationDelay: '0.6s' }}>
          {step === 'events' && (
            <>
              {loading && (
                <div className="flex items-center justify-center space-x-3 text-white">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span className="text-lg">Discovering today's adventures…</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-200 backdrop-blur-sm">
                  {error}
                </div>
              )}
              
              {!loading && !error && (
                <div className="space-y-4">
                  {events && events.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-white/90 mb-4">Available Adventures</h3>
                      <div className="space-y-2">
                        {events.map((evt, index) => (
                          <button 
                            key={evt.key}
                            className="w-full max-w-md mx-auto group"
                            onClick={() => handleEventSelect(evt)}
                            style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                          >
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl fade-in-up-animation">
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <div className="font-semibold text-white text-lg">{evt.orgName}</div>
                                  <div className="text-sm" style={{ color: 'rgba(234, 227, 212, 0.8)' }}>Event: {evt.eventName}</div>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                                  <svg className='w-5 h-5 text-white group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white/80">
                      No adventures scheduled for today. Ready to create one?
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'teams' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-shrink-0 mb-4">
                <h3 className="text-base font-medium text-white/90">Choose Your Team</h3>
              </div>
              {/* Scrollable team grid */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {MOCK_TEAMS.map((teamName, index) => (
                    <button
                      key={teamName}
                      className="group"
                      onClick={() => handleTeamSelect(teamName)}
                      style={{ animationDelay: `${0.8 + index * 0.05}s` }}
                    >
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl fade-in-up-animation h-full">
                        <div className="flex flex-col items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg"
                            style={{ 
                              backgroundColor: teamName.toLowerCase() === 'red' ? '#DC2626' :
                                              teamName.toLowerCase() === 'green' ? '#16A34A' :
                                              teamName.toLowerCase() === 'blue' ? '#2563EB' :
                                              teamName.toLowerCase() === 'yellow' ? '#CA8A04' :
                                              teamName.toLowerCase() === 'orange' ? '#EA580C' : 
                                              'rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            {teamName.charAt(0)}
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-white text-sm">Team {teamName}</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(234, 227, 212, 0.7)' }}>
                              Join {teamName.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200"
                    placeholder="First name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200"
                    placeholder="Email address"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full group relative overflow-hidden text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 modern-action-button"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>Start Your Adventure</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Main action button - only show during events step */}
        {step === 'events' && (
          <div className="fade-in-up-animation" style={{ animationDelay: '0.9s' }}>
            <button
              onClick={onSetupNew}
              className="group relative overflow-hidden text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full max-w-sm sm:min-w-[250px] modern-action-button"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Set up a new adventure</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .modern-splash-screen {
          backdrop-filter: blur(8px);
        }
        
        .modern-action-button {
          background: linear-gradient(135deg, 
            var(--color-cabernet) 0%, 
            var(--color-cabernet-hover) 100%
          );
          box-shadow: 0 10px 30px rgba(85, 36, 72, 0.4);
        }
        
        .scale-in-animation {
          animation: scaleIn 0.8s ease-out forwards;
        }
        
        .fade-in-up-animation {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(30px);
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  )
}