import React, { useState, useEffect } from 'react'
import MountainLogo from '../../components/MountainLogo'
import { useToastActions } from '../notifications/ToastProvider'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'
import { authService } from '../../services/AuthService'

interface UnifiedSplashScreenProps {
  onContinueHunt: (event: OrgEvent, participantInfo: ParticipantInfo) => void
  onJoinEvent: (event: OrgEvent, teamName: string) => void
  onPlanFuture: (customerData: CustomerData) => void
  onCreateNew: () => void
  onClose?: () => void
}

interface ParticipantInfo {
  firstName: string
  lastName: string
  email: string
  teamName: string
}

interface CustomerData {
  email: string
  firstName: string
  interests: string[]
  eventType?: 'corporate' | 'family' | 'date' | 'friends'
}

const MOCK_TEAMS = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']

export default function UnifiedSplashScreen({ onContinueHunt, onJoinEvent, onPlanFuture, onCreateNew, onClose }: UnifiedSplashScreenProps) {
  const { success: showSuccessToast, warning: showWarningToast } = useToastActions()
  const [step, setStep] = useState<'main' | 'continue-hunt' | 'magic-link-sent' | 'join-event' | 'select-team' | 'enter-info' | 'plan-future' | 'interests' | 'details'>('main')
  const [events, setEvents] = useState<OrgEvent[] | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Magic link state
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  
  // Form states
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
    firstName: '',
    lastName: '',
    email: '',
    teamName: ''
  })
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    email: '',
    firstName: '',
    interests: []
  })
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  // Load today's events on component mount
  useEffect(() => {
    loadTodaysEvents()
  }, [])

  const loadTodaysEvents = async () => {
    try {
      setLoading(true)
      const items = await fetchTodaysEvents()
      setEvents(items)
    } catch (e: any) {
      console.warn('Failed to load today\'s events', e)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateParticipantForm = (): boolean => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: ''
    }
    let isValid = true

    if (!participantInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required'
      isValid = false
    }

    if (!participantInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
      isValid = false
    }

    if (!participantInfo.email.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(participantInfo.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleInputChange = (field: keyof ParticipantInfo, value: string) => {
    setParticipantInfo(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleContinueHuntSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateParticipantForm() && selectedEvent) {
      onContinueHunt(selectedEvent, participantInfo)
    }
  }

  const handleJoinEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateParticipantForm() && selectedEvent && selectedTeam) {
      onJoinEvent(selectedEvent, selectedTeam)
    }
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    
    if (!magicLinkEmail.trim()) {
      setEmailError('Email is required')
      return
    }
    
    if (!validateEmail(magicLinkEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    try {
      setMagicLinkLoading(true)
      
      const returnUrl = authService.generateReturnUrl('/hunt')
      const response = await authService.sendMagicLink({
        email: magicLinkEmail,
        returnUrl
      })
      
      if (response.success) {
        showSuccessToast(response.message)
        setStep('magic-link-sent')
        
        // In development, log the token for testing
        if (response.token && process.env.NODE_ENV === 'development') {
          console.log('🔑 Development token:', response.token)
          console.log('🔗 Test link:', `${window.location.origin}/auth/verify?token=${response.token}`)
        }
      } else {
        setEmailError(response.message)
      }
      
    } catch (error: any) {
      console.error('Failed to send magic link:', error)
      const message = error?.body?.message || error?.message || 'Failed to send magic link. Please try again.'
      setEmailError(message)
    } finally {
      setMagicLinkLoading(false)
    }
  }

  const interestOptions = [
    { id: 'adventure', label: 'Outdoor Adventures', icon: '🏔️' },
    { id: 'team-building', label: 'Team Building', icon: '👥' },
    { id: 'date-night', label: 'Date Experiences', icon: '💕' },
    { id: 'family', label: 'Family Activities', icon: '👨‍👩‍👧‍👦' },
    { id: 'photography', label: 'Photo Challenges', icon: '📸' },
    { id: 'local-culture', label: 'Local Culture', icon: '🏘️' }
  ]

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
      <div className="relative z-10 h-full flex flex-col mx-auto p-4 sm:p-6 text-center max-w-lg">
        {/* Header Section */}
        <div className="flex-shrink-0">
          {/* Back button for non-main steps */}
          {step !== 'main' && (
            <div className="mb-4">
              <button
                onClick={() => {
                  if (step === 'continue-hunt' || step === 'magic-link-sent' || step === 'join-event' || step === 'plan-future') {
                    setStep('main')
                  } else if (step === 'select-team' || step === 'enter-info') {
                    setStep('join-event')
                  } else if (step === 'interests') {
                    setStep('plan-future')
                  } else if (step === 'details') {
                    setStep('interests')
                  }
                }}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 group"
                aria-label="Go back"
              >
                <svg className='w-4 h-4 group-hover:-translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
              </button>
            </div>
          )}

          {/* Logo section - show on main screen */}
          {step === 'main' && (
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
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up-animation">
          {step === 'main' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                What brings you here today?
              </h2>

              {/* Option 1: Continue Your Hunt (Returning Participant) */}
              <button
                onClick={() => setStep('continue-hunt')}
                className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Continue Your Hunt</div>
                    <div className="text-sm text-white/70">Already participating? Jump back in!</div>
                  </div>
                  <svg className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>

              {/* Option 2: Join Today's Event (New Participant) */}
              <button
                onClick={() => setStep('join-event')}
                className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">🏃</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Join Today's Event</div>
                    <div className="text-sm text-white/70">New participant? Sign up now!</div>
                  </div>
                  <svg className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>

              {/* Option 3: Plan Future Event (Prospect/Lead) */}
              <button
                onClick={() => setStep('plan-future')}
                className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Plan Future Event</div>
                    <div className="text-sm text-white/70">Interested? Get personalized recommendations</div>
                  </div>
                  <svg className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>

              {/* Option 4: Create New Hunt (Organizer) */}
              <button
                onClick={onCreateNew}
                className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-2xl">➕</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Create New Hunt</div>
                    <div className="text-sm text-white/70">Organize your own adventure</div>
                  </div>
                  <svg className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Continue Hunt Flow - Magic Link Authentication */}
          {step === 'continue-hunt' && (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Welcome Back!
                </h2>
                <p className="text-white/80">
                  Enter your email address and we'll send you a secure link to continue your hunt.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={magicLinkEmail}
                    onChange={(e) => {
                      setMagicLinkEmail(e.target.value)
                      setEmailError('')
                    }}
                    className={`form-field ${emailError ? 'error-field' : ''}`}
                    placeholder="Enter your email address"
                    required
                    disabled={magicLinkLoading}
                  />
                  {emailError && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {emailError}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={magicLinkLoading}
                className="w-full group relative overflow-hidden text-white font-semibold text-base px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 modern-action-button disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {magicLinkLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending Magic Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
          )}

          {/* Magic Link Sent Confirmation */}
          {step === 'magic-link-sent' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <span className="text-4xl">✉️</span>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Check Your Email!
              </h2>
              <p className="text-white/80">
                We've sent a secure login link to <span className="font-semibold text-white">{magicLinkEmail}</span>
              </p>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-left">
                <h4 className="font-semibold text-white mb-2">Next Steps:</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">1.</span>
                    Check your email (including spam folder)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">2.</span>
                    Click the secure login link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">3.</span>
                    Continue your hunt adventure!
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setMagicLinkEmail('')
                  setStep('continue-hunt')
                }}
                className="text-white/70 hover:text-white underline text-sm"
              >
                Try a different email address
              </button>
            </div>
          )}

          {/* Join Event Flow */}
          {step === 'join-event' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Join Today's Adventure
              </h2>
              <p className="text-white/80">
                Select an event to join as a new participant.
              </p>

              {loading && (
                <div className="flex items-center justify-center space-x-3 text-white">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span>Loading events...</span>
                </div>
              )}

              {events && events.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white/90">Available Events</h3>
                  <div className="space-y-2">
                    {events.map((evt) => (
                      <button 
                        key={evt.key}
                        onClick={() => {
                          setSelectedEvent(evt)
                          setStep('select-team')
                        }}
                        className="w-full group"
                      >
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <div className="font-semibold text-white">{evt.orgName}</div>
                              <div className="text-sm text-white/70">{evt.eventName}</div>
                            </div>
                            <svg className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {events && events.length === 0 && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-white/80">
                  No events scheduled for today. Would you like to create one?
                </div>
              )}
            </div>
          )}

          {/* Team Selection */}
          {step === 'select-team' && selectedEvent && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Choose Your Team
              </h2>
              <p className="text-white/80">
                Joining: <span className="font-semibold">{selectedEvent.eventName}</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {MOCK_TEAMS.map((teamName) => (
                  <button
                    key={teamName}
                    onClick={() => {
                      setSelectedTeam(teamName)
                      setParticipantInfo(prev => ({ ...prev, teamName }))
                      setStep('enter-info')
                    }}
                    className="group"
                  >
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300">
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
                          <div className="text-xs text-white/70">Join {teamName.toLowerCase()}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enter Information */}
          {step === 'enter-info' && (
            <form onSubmit={handleContinueHuntSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                {selectedTeam ? `Joining Team ${selectedTeam}` : 'Confirm Your Details'}
              </h2>
              <p className="text-white/80">
                Event: <span className="font-semibold">{selectedEvent?.eventName}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={participantInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`form-field ${errors.firstName ? 'error-field' : ''}`}
                    placeholder="First name"
                    required
                  />
                  {errors.firstName && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={participantInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`form-field ${errors.lastName ? 'error-field' : ''}`}
                    placeholder="Last name"
                    required
                  />
                  {errors.lastName && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    value={participantInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`form-field ${errors.email ? 'error-field' : ''}`}
                    placeholder="Email address"
                    required
                  />
                  {errors.email && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative overflow-hidden text-white font-semibold text-base px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 modern-action-button"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Start Your Adventure</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
          )}

          {/* Plan Future Event Flow (simplified version) */}
          {step === 'plan-future' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Plan Your Adventure
              </h2>
              <p className="text-white/80">
                Tell us about your interests and we'll send you personalized recommendations.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const interests = customerData.interests.includes(option.id)
                        ? customerData.interests.filter(i => i !== option.id)
                        : [...customerData.interests, option.id]
                      setCustomerData(prev => ({ ...prev, interests }))
                    }}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      customerData.interests.includes(option.id)
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (customerData.interests.length > 0) {
                    onPlanFuture(customerData)
                  }
                }}
                disabled={customerData.interests.length === 0}
                className={`w-full px-6 py-3 rounded-full transition-all duration-300 ${
                  customerData.interests.length > 0
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                    : 'bg-white/5 text-white/50 cursor-not-allowed border border-white/10'
                }`}
              >
                Get Recommendations ({customerData.interests.length} selected)
              </button>
            </div>
          )}
        </div>

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
        
        .form-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        
        .form-field::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .form-field:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }
        
        .error-field {
          border-color: #f87171 !important;
          background: linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(248, 113, 113, 0.05) 100%);
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
        }
        
        .error-message {
          color: #fca5a5;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
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