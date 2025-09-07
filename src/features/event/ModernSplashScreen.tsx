import React, { useEffect, useState } from 'react'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'
import MountainLogo from '../../components/MountainLogo'

interface ModernSplashScreenProps {
  onSelectEvent: (evt: OrgEvent) => void
  onSetupNew: () => void
  onClose?: () => void
}

export default function ModernSplashScreen({ onSelectEvent, onSetupNew, onClose }: ModernSplashScreenProps) {
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
      
      {/* Close button - top right */}
      {onClose && (
        <button
          className="absolute top-6 right-6 z-10 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-200 group"
          aria-label="Close"
          onClick={onClose}
        >
          <svg className='w-5 h-5 group-hover:scale-110 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      )}

      {/* Main content container */}
      <div className="relative z-10 max-w-2xl mx-auto p-4 sm:p-8 text-center">
        {/* Logo section */}
        <div className="mb-8 scale-in-animation">
          <MountainLogo size="xl" animated className="mx-auto mb-6" />
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Vail Hunt
            </h1>
            <p className="text-lg sm:text-xl font-light tracking-wide" style={{ color: 'var(--color-cream)' }}>
              Mountain Adventure Awaits
            </p>
          </div>
        </div>

        {/* Welcome message */}
        <div className="mb-8 fade-in-up-animation" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Welcome to Your Adventure</h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto px-4" style={{ color: 'rgba(234, 227, 212, 0.9)' }}>
            Choose your organization for today's event, or set up a new mountain expedition.
          </p>
        </div>

        {/* Events section */}
        <div className="mb-8 fade-in-up-animation" style={{ animationDelay: '0.6s' }}>
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
                        onClick={() => onSelectEvent(evt)}
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
        </div>

        {/* Main action button */}
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
      </div>

      <style jsx>{`
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