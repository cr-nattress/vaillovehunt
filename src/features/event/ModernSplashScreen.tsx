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
  const [step, setStep] = useState<'events' | 'teams' | 'form' | 'new-org' | 'new-hunt'>('events')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [orgFormData, setOrgFormData] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: ''
  })
  const [orgFormErrors, setOrgFormErrors] = useState({
    organizationName: '',
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

  const handleStartNewAdventure = () => {
    setStep('new-org')
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleOrgFormChange = (field: keyof typeof orgFormData, value: string) => {
    setOrgFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (orgFormErrors[field]) {
      setOrgFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateOrgForm = (): boolean => {
    const errors = {
      organizationName: '',
      firstName: '',
      lastName: '',
      email: ''
    }
    let isValid = true

    if (!orgFormData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required'
      isValid = false
    }

    if (!orgFormData.firstName.trim()) {
      errors.firstName = 'First name is required'
      isValid = false
    }

    if (!orgFormData.lastName.trim()) {
      errors.lastName = 'Last name is required'
      isValid = false
    }

    if (!orgFormData.email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(orgFormData.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    setOrgFormErrors(errors)
    return isValid
  }

  const handleOrgFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateOrgForm()) {
      setStep('new-hunt')
    }
  }

  const isOrgFormValid = (): boolean => {
    return (
      orgFormData.organizationName.trim() !== '' &&
      orgFormData.firstName.trim() !== '' &&
      orgFormData.lastName.trim() !== '' &&
      orgFormData.email.trim() !== '' &&
      validateEmail(orgFormData.email)
    )
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
              {(step === 'teams' || step === 'form' || step === 'new-org' || step === 'new-hunt') && (
                <button
                  onClick={
                    step === 'teams' ? handleBackToEvents :
                    step === 'form' ? handleBackToTeams :
                    step === 'new-org' ? handleBackToEvents :
                    step === 'new-hunt' ? () => setStep('new-org') :
                    handleBackToEvents
                  }
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 group"
                  aria-label={
                    step === 'teams' ? 'Back to events' :
                    step === 'form' ? 'Back to teams' :
                    step === 'new-org' ? 'Back to events' :
                    step === 'new-hunt' ? 'Back to organization setup' :
                    'Back'
                  }
                >
                  <svg className='w-4 h-4 group-hover:-translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {step === 'events' ? 'Welcome to Your Adventure' : 
                 step === 'teams' ? 'Select Your Team' : 
                 step === 'form' ? 'Enter Your Information' :
                 step === 'new-org' ? 'Set Up Your Organization' :
                 step === 'new-hunt' ? 'Create Your Adventure' :
                 'Welcome to Your Adventure'}
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed max-w-md mx-auto px-2" style={{ color: 'rgba(234, 227, 212, 0.9)' }}>
              {step === 'events' 
                ? 'Choose your organization for today\'s event, or set up a new mountain expedition.'
                : step === 'teams'
                ? `Choose your team for ${selectedEvent?.eventName} - ${selectedEvent?.orgName}`
                : step === 'form'
                ? `Complete your registration for Team ${selectedTeam} - ${selectedEvent?.eventName}`
                : step === 'new-org'
                ? 'Provide your organization details to create a new scavenger hunt experience.'
                : step === 'new-hunt'
                ? 'Design your adventure with custom locations and challenges.'
                : 'Choose your adventure path.'
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

          {step === 'new-org' && (
            <form onSubmit={handleOrgFormSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="space-y-4">
                {/* Organization Name */}
                <div>
                  <input
                    type="text"
                    id="organizationName"
                    required
                    value={orgFormData.organizationName}
                    onChange={(e) => handleOrgFormChange('organizationName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 ${
                      orgFormErrors.organizationName ? 'border-red-400/60' : 'border-white/20'
                    }`}
                    placeholder="Organization name"
                    aria-invalid={orgFormErrors.organizationName ? 'true' : 'false'}
                  />
                  {orgFormErrors.organizationName && (
                    <p className="text-red-300 text-xs mt-1" role="alert">
                      {orgFormErrors.organizationName}
                    </p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <input
                    type="text"
                    id="orgFirstName"
                    required
                    value={orgFormData.firstName}
                    onChange={(e) => handleOrgFormChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 ${
                      orgFormErrors.firstName ? 'border-red-400/60' : 'border-white/20'
                    }`}
                    placeholder="First name"
                    aria-invalid={orgFormErrors.firstName ? 'true' : 'false'}
                  />
                  {orgFormErrors.firstName && (
                    <p className="text-red-300 text-xs mt-1" role="alert">
                      {orgFormErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <input
                    type="text"
                    id="orgLastName"
                    required
                    value={orgFormData.lastName}
                    onChange={(e) => handleOrgFormChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 ${
                      orgFormErrors.lastName ? 'border-red-400/60' : 'border-white/20'
                    }`}
                    placeholder="Last name"
                    aria-invalid={orgFormErrors.lastName ? 'true' : 'false'}
                  />
                  {orgFormErrors.lastName && (
                    <p className="text-red-300 text-xs mt-1" role="alert">
                      {orgFormErrors.lastName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    id="orgEmail"
                    required
                    value={orgFormData.email}
                    onChange={(e) => handleOrgFormChange('email', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 ${
                      orgFormErrors.email ? 'border-red-400/60' : 'border-white/20'
                    }`}
                    placeholder="Email address"
                    aria-invalid={orgFormErrors.email ? 'true' : 'false'}
                  />
                  {orgFormErrors.email && (
                    <p className="text-red-300 text-xs mt-1" role="alert">
                      {orgFormErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!isOrgFormValid()}
                  className={`w-full group relative overflow-hidden font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl transition-all duration-300 modern-action-button ${
                    isOrgFormValid() 
                      ? 'text-white hover:shadow-2xl transform hover:scale-105' 
                      : 'text-white/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>Continue to Adventure Setup</span>
                    <svg className={`w-5 h-5 transition-transform ${isOrgFormValid() ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  {isOrgFormValid() && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    />
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'new-hunt' && (
            <div className="space-y-6 max-w-md mx-auto">
              {/* Organization Summary */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-white/90 mb-3">Organization Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Organization:</span>
                    <span className="text-white">{orgFormData.organizationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Contact:</span>
                    <span className="text-white">{orgFormData.firstName} {orgFormData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Email:</span>
                    <span className="text-white">{orgFormData.email}</span>
                  </div>
                </div>
              </div>

              {/* Hunt Creation Placeholder */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Adventure Designer</h3>
                <p className="text-sm text-white/70 mb-4">
                  Here you'll create custom locations, challenges, and set up your scavenger hunt experience for {orgFormData.organizationName}.
                </p>
                <div className="text-xs text-white/50">
                  Hunt creation tools will be added in Phase 3
                </div>
              </div>
              
              {/* Completion Preview */}
              <div className="text-center">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/60">
                    Phase 4 will add persistence to save your adventure
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main action button - only show during events step */}
        {step === 'events' && (
          <div className="fade-in-up-animation" style={{ animationDelay: '0.9s' }}>
            <button
              onClick={handleStartNewAdventure}
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