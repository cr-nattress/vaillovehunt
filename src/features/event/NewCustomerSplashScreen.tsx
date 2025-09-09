import React, { useState } from 'react'
import MountainLogo from '../../components/MountainLogo'
import { useToastActions } from '../notifications/ToastProvider'

interface NewCustomerSplashScreenProps {
  onJoinToday: () => void
  onPlanFuture: (customerData: CustomerData) => void
  onClose?: () => void
}

interface CustomerData {
  email: string
  firstName: string
  interests: string[]
  preferredLocation?: string
  eventType?: 'corporate' | 'family' | 'date' | 'friends'
}

export default function NewCustomerSplashScreen({ onJoinToday, onPlanFuture, onClose }: NewCustomerSplashScreenProps) {
  const { success: showSuccessToast, warning: showWarningToast } = useToastActions()
  const [step, setStep] = useState<'welcome' | 'interests' | 'details'>('welcome')
  const [customerData, setCustomerData] = useState<CustomerData>({
    email: '',
    firstName: '',
    interests: []
  })
  const [errors, setErrors] = useState({
    email: '',
    firstName: ''
  })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleInterestToggle = (interest: string) => {
    setCustomerData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const validateStep = (): boolean => {
    const newErrors = {
      email: '',
      firstName: ''
    }
    let isValid = true

    if (!customerData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
      isValid = false
    }

    if (!customerData.email.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(customerData.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep()) {
      onPlanFuture(customerData)
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

  const eventTypeOptions = [
    { id: 'corporate', label: 'Corporate Event', icon: '🏢', description: 'Team building and company outings' },
    { id: 'family', label: 'Family Fun', icon: '👨‍👩‍👧‍👦', description: 'Activities for all ages' },
    { id: 'date', label: 'Date Night', icon: '💕', description: 'Romantic adventures for couples' },
    { id: 'friends', label: 'Friends Group', icon: '👥', description: 'Social activities with friends' }
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
          {/* Logo section */}
          <div className="mb-6 scale-in-animation">
            <MountainLogo size="lg" animated className="mx-auto mb-4" />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Vail Hunt
              </h1>
              <p className="text-base sm:text-lg font-light tracking-wide" style={{ color: 'var(--color-cream)' }}>
                Create Unforgettable Adventures
              </p>
            </div>
          </div>

          {/* Navigation breadcrumbs for multi-step flow */}
          {step !== 'welcome' && (
            <div className="mb-6">
              <button
                onClick={() => {
                  if (step === 'details') setStep('interests')
                  else if (step === 'interests') setStep('welcome')
                }}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 group mb-4"
                aria-label="Go back"
              >
                <svg className='w-4 h-4 group-hover:-translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
              </button>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 'welcome' ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 'interests' ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 'details' ? 'bg-white' : 'bg-white/30'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-h-0 fade-in-up-animation" style={{ animationDelay: '0.3s' }}>
          {step === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Welcome to Mountain Adventures
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-white/80 max-w-md mx-auto">
                  Create custom scavenger hunts and photo challenges in beautiful Vail. 
                  Perfect for teams, dates, families, and friends.
                </p>
              </div>

              {/* Value propositions */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    🎯
                  </div>
                  <span className="text-sm">Customize challenges for your group</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    📱
                  </div>
                  <span className="text-sm">Easy mobile experience</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    🏔️
                  </div>
                  <span className="text-sm">Discover Vail like never before</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={onJoinToday}
                  className="w-full group relative overflow-hidden text-white font-semibold text-base px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 modern-action-button"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>Join Today's Adventure</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>

                <button
                  onClick={() => setStep('interests')}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                >
                  Plan a Future Event
                </button>
              </div>
            </div>
          )}

          {step === 'interests' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  What Interests You?
                </h2>
                <p className="text-sm text-white/70">
                  Select all that apply to personalize your experience
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleInterestToggle(option.id)}
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
                onClick={() => setStep('details')}
                disabled={customerData.interests.length === 0}
                className={`w-full px-6 py-3 rounded-full transition-all duration-300 ${
                  customerData.interests.length > 0
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                    : 'bg-white/5 text-white/50 cursor-not-allowed border border-white/10'
                }`}
              >
                Continue ({customerData.interests.length} selected)
              </button>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Tell Us About Yourself
                </h2>
                <p className="text-sm text-white/70">
                  We'll send you personalized recommendations
                </p>
              </div>

              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <input
                    type="text"
                    value={customerData.firstName}
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

                {/* Email */}
                <div>
                  <input
                    type="email"
                    value={customerData.email}
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

                {/* Event Type */}
                <div>
                  <label className="text-sm text-white/80 mb-3 block">What type of event are you planning?</label>
                  <div className="space-y-2">
                    {eventTypeOptions.map((option) => (
                      <label key={option.id} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="eventType"
                          value={option.id}
                          onChange={(e) => handleInputChange('eventType', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all duration-300 ${
                          customerData.eventType === option.id
                            ? 'bg-white/20 border-white/40 text-white'
                            : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                        }`}>
                          <span className="text-lg">{option.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-white/60">{option.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative overflow-hidden text-white font-semibold text-base px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 modern-action-button"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Get Personalized Recommendations</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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