import React, {useState, useEffect, useMemo} from 'react'
import { CollageService } from './client/CollageService'
import { PhotoUploadService } from './client/PhotoUploadService'
import { PhotoService } from './services/PhotoService'
import { DualWriteService } from './client/DualWriteService'
import { seedInitialData } from './services/SeedService'
import ProgressGauge from './components/ProgressGauge'
import AlbumViewer from './components/AlbumViewer'
import Header from './features/app/Header'
import SettingsPanel from './features/app/SettingsPanel'
import StopsList from './features/app/StopsList'
import FooterNav from './features/app/FooterNav'
import { UploadProvider } from './features/upload/UploadContext'
import { useAppStore } from './store/appStore'
import { useNavigationStore } from './store/navigation.store'
import { useEventStore } from './store/event.store'
import { useProgressStore } from './store/progress.store'
import { getPathParams, isValidParamSet, normalizeParams } from './utils/url'
import { slugify } from './utils/slug'
import { base64ToFile, compressImage } from './utils/image'
import { buildStorybook } from './utils/canvas'
import { generateGuid } from './utils/id'
import { getRandomStops } from './utils/random'
// Phase 3: Deprecated - no longer using hash router
// import { useHashRouter } from './hooks/useHashRouter'
import FeedPage from './features/feed/components/FeedPage'
import EventPage from './features/event/EventPage'
import SplashScreen from './features/event/ModernSplashScreen'

/**
 * Vail Love Hunt — React single-page app for a couples' scavenger/date experience in Vail.
 *
 * Key behaviors:
 * - Shows a list of romantic stops with clues and a selfie mission per stop.
 * - Tracks completion and notes in localStorage.
 * - Provides a share action, date tips overlay, and progress bar.
 */

export default function App() {
  // Use Zustand stores for state management
  const { 
    sessionId, teamPhotos,
    saveTeamPhoto, getTeamPhotos, clearTeamPhotos, clearAllTeamData, switchTeam
  } = useAppStore()
  
  // Navigation from dedicated store
  const { currentPage, navigate, taskTab, setTaskTab } = useNavigationStore()
  
  // Event identity and UI intents from dedicated store
  const { 
    locationName, eventName, teamName, lockedByQuery,
    setLocationName, setEventName, setTeamName, setLockedByQuery,
    requestOpenEventSettings
  } = useEventStore()
  
  // Progress state and actions from dedicated store
  const { 
    progress, setProgress, updateStopProgress, resetProgress, resetHints
  } = useProgressStore()
  
  // Phase 3: Deprecated - no longer using hash router
  // const { currentPage: hashPage, navigateToPage: hashNavigateToPage } = useHashRouter()
  
  const [stops, setStops] = useState(() => getRandomStops(locationName || 'BHHS'))
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  
  // Calculate progress stats from Zustand state
  const completeCount = useMemo(() => stops.reduce((acc, s) => acc + ((progress[s.id]?.done) ? 1 : 0), 0), [progress, stops])
  const percent = stops.length === 0 ? 0 : Math.round((completeCount / stops.length) * 100)
  const [showTips, setShowTips] = useState(false)
  const [storybookUrl, setStorybookUrl] = useState(null)
  const [collageLoading, setCollageLoading] = useState(false)
  const [collageUrl, setCollageUrl] = useState(null)
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState(null)
  const [expandedStops, setExpandedStops] = useState({})
  const [transitioningStops, setTransitioningStops] = useState(new Set())
  const [uploadingStops, setUploadingStops] = useState(new Set())
  const [completedSectionExpanded, setCompletedSectionExpanded] = useState(false)
  // Phase 2: activeTab replaced with store's taskTab
  // const [activeTab, setActiveTab] = useState('current') // DEPRECATED

  // Phase 3: Deprecated - hash-related functions no longer needed
  // const getTabFromHash = () => { ... }
  // const updateHashWithTab = (tab) => { ... }

  // Phase 3: Set active tab using store only (no hash sync)
  const setActiveTabWithHistory = (tab) => {
    console.log(`🧭 Phase 3: Setting task tab via store only: ${tab}`)
    setTaskTab(tab)
  }

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = (event) => {
    const tabs = ['current', 'completed']
    const currentIndex = tabs.indexOf(taskTab)
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault()
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        const newIndex = (currentIndex + direction + tabs.length) % tabs.length
        const newTab = tabs[newIndex]
        setActiveTabWithHistory(newTab)
        // Focus the newly selected tab
        setTimeout(() => {
          document.getElementById(`${newTab}-tab`)?.focus()
        }, 0)
        break
        
      case 'Home':
        event.preventDefault()
        setActiveTabWithHistory('current')
        setTimeout(() => {
          document.getElementById('current-tab')?.focus()
        }, 0)
        break
        
      case 'End':
        event.preventDefault()
        setActiveTabWithHistory('completed')
        setTimeout(() => {
          document.getElementById('completed-tab')?.focus()
        }, 0)
        break
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        // Tab is already focused, no need to change selection
        break
    }
  }

  // Phase 2: Deprecated - tab initialization now handled by store
  // Old tab initialization effect removed - now using store initialization

  // Initialize session and load saved settings on app startup
  useEffect(() => {
    // Phase 2: initialize from path params
    const applyFromPath = () => {
      try {
        const params = getPathParams(window.location.pathname)
        if (isValidParamSet(params)) {
          const { location, event, team } = normalizeParams(params)
          setLocationName(location)
          setEventName(event)
          setTeamName(team)
          setLockedByQuery(true)
          // If edit mode was open, close it when lock engages
          setIsEditMode(false)
          console.log('[URL] Locked by path params:', { location, event, team })
        } else {
          setLockedByQuery(false)
          console.log('[URL] No valid path params detected; app remains unlocked')
        }
      } catch (e) {
        setLockedByQuery(false)
        console.warn('[URL] Failed to parse path params; defaulting to unlocked mode:', e)
      }
    }

    applyFromPath()

    const onPopState = () => applyFromPath()
    window.addEventListener('popstate', onPopState)

    const initializeApp = async () => {
      try {
        // Seed initial data for splash screen (BHHS, Vail, teams)
        await seedInitialData({ skipExisting: true });
        
        // Load saved settings using DualWriteService
        const savedSettings = await DualWriteService.get('app-settings');
        if (savedSettings) {
          console.log('📱 Loaded saved settings:', savedSettings);
          
          if (savedSettings.location) {
            setLocationName(savedSettings.location);
          }
          if (savedSettings.team) {
            setTeamName(savedSettings.team);
          }
          if (savedSettings.event) {
            setEventName(savedSettings.event);
          }
        }
        
        // Initialize session with current location name using DualWriteService
        const sessionId = generateGuid();
        const sessionData = {
          id: sessionId,
          location: locationName,
          startTime: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        
        console.log('🚀 Initializing session:', sessionId);
        
        const results = await DualWriteService.createSession(sessionId, sessionData);
        console.log('✅ Session initialized:', results);
        
        // Reset all hints to 1 on fresh page load
        resetHints();
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };
    
    initializeApp();

    // Show splash on root path when not locked by query params
    if (window.location.pathname === '/' && !lockedByQuery) {
      setShowSplash(true)
    }

    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Update stops when location changes
  useEffect(() => {
    console.log(`🗺️ Location changed to: ${locationName}, updating stops...`);
    const newStops = getRandomStops(locationName);
    setStops(newStops);
    console.log(`✅ Updated stops for ${locationName}:`, newStops.map(s => s.title));
  }, [locationName])

  // Team switching effect - use Zustand switchTeam action
  useEffect(() => {
    if (!teamName || !locationName || !eventName) return;
    
    console.log(`🔄 TEAM SWITCH EFFECT: ${teamName}, location: ${locationName}, event: ${eventName}`);
    
    // Reset UI state on team change
    setExpandedStops({});
    setTransitioningStops(new Set());
    setUploadingStops(new Set());
    setCollageUrl(null);
    setFullSizeImageUrl(null);
    setStorybookUrl(null);
    
    // Load team photos into progress via Zustand
    const teamPhotos = getTeamPhotos(locationName, eventName, teamName);
    
    // Get current progress from store to preserve hint counts for existing stops
    const { getState } = useProgressStore
    const currentProgress = getState().progress;
    
    const photoProgress = {};
    teamPhotos.forEach(photo => {
      // Preserve existing revealed hints if this stop already exists in progress
      const existingProgress = currentProgress[photo.locationId];
      const preservedHints = existingProgress?.revealedHints || 1;
      
      photoProgress[photo.locationId] = {
        done: true,
        notes: '',
        photo: photo.photoUrl,
        completedAt: photo.uploadedAt,
        revealedHints: preservedHints // Preserve existing hint progress
      };
    });
    
    console.log(`🔄 Loading ${teamPhotos.length} photos for team ${teamName}:`, photoProgress);
    setProgress(photoProgress);
    
  }, [teamName, locationName, eventName, getTeamPhotos, setProgress])


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('header')) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])

  // Phase 3 - Navigation completely decoupled from hash
  // All hash-related initialization and sync effects removed

  // Handle photo upload for a stop (using Zustand)
  const handlePhotoUpload = async (stopId, file) => {
    console.log(`🔄 ZUSTAND UPLOAD START: stopId=${stopId}, team=${teamName}, location=${locationName}, event=${eventName}`)
    
    // Log current Zustand state
    console.log(`📊 Current Zustand progress:`, progress)
    console.log(`📊 Current Zustand teamPhotos:`, teamPhotos)
    
    const stop = stops.find(s => s.id === stopId)
    const currentState = progress[stopId] || { done: false, notes: '', photo: null, revealedHints: 1 }
    
    console.log(`📊 Current progress state for ${stopId}:`, currentState)
    
    // Start loading state
    setUploadingStops(prev => new Set([...prev, stopId]))
    
    try {
      // Ensure we have a team name - use default if empty
      const effectiveTeamName = teamName || 'Blue'
      console.log(`🏷️ Using teamName: "${effectiveTeamName}" (original: "${teamName}")`)
      
      // Check if photo already exists in Zustand store
      const existingPhotos = getTeamPhotos(locationName, eventName, effectiveTeamName)
      const existingPhoto = existingPhotos.find(photo => photo.locationId === stopId)
      
      if (existingPhoto) {
        console.log(`📷 EXISTING PHOTO FOUND in Zustand:`, existingPhoto)
        console.log(`🔄 Using existing photo URL: ${existingPhoto.photoUrl}`)
        
        updateStopProgress(stopId, {
          ...currentState,
          photo: existingPhoto.photoUrl,
          done: true,
          completedAt: new Date().toISOString()
        })
      } else {
        console.log(`📷 NO EXISTING PHOTO - proceeding with upload`)
        
        // Upload to server/Cloudinary
        console.log(`📸 Uploading new photo for ${stop.title}`)
        
        const uploadResponse = await PhotoUploadService.uploadPhotoWithResize(
          file, 
          stop.title, 
          sessionId,
          1600, // maxWidth
          0.8,  // quality
          effectiveTeamName,
          locationName,
          eventName
        )
        
        console.log(`💾 UPLOAD RESPONSE:`, uploadResponse)
        
        // Create photo record
        const photoRecord = {
          ...uploadResponse,
          locationId: stopId
        }
        
        // Save to Zustand (replaces localStorage)
        console.log(`💾 Saving photo record to Zustand...`)
        saveTeamPhoto(locationName, eventName, effectiveTeamName, photoRecord)
        
        // Also save to PhotoService API for feed access
        console.log(`💾 Saving photo record to PhotoService API...`)
        try {
          await PhotoService.saveTeamPhoto(locationName, eventName, effectiveTeamName, photoRecord)
          console.log(`✅ Photo saved to API successfully`)
        } catch (apiError) {
          console.warn(`⚠️ Failed to save to API, but continuing:`, apiError)
        }
        
        // Update progress state
        console.log(`📊 Updating progress with photo URL: ${uploadResponse.photoUrl}`)
        updateStopProgress(stopId, {
          ...currentState,
          photo: uploadResponse.photoUrl,
          done: true,
          completedAt: new Date().toISOString()
        })
        
        console.log(`✅ Photo uploaded and saved to Zustand for ${stop.title}`)
      }
      
      // End loading state
      setUploadingStops(prev => {
        const newSet = new Set(prev)
        newSet.delete(stopId)
        return newSet
      })
      
      // Step 2: Quick celebration animation
      setTimeout(() => {
        setTransitioningStops(prev => new Set([...prev, stopId]))
        
        // Step 3: Complete transition quickly
        setTimeout(() => {
          setTransitioningStops(prev => {
            const newSet = new Set(prev)
            newSet.delete(stopId)
            return newSet
          })
        }, 600)
      }, 150)
      
    } catch (error) {
      console.error('❌ Photo upload failed:', error)
      console.error(`Failed to upload photo: ${error.message}`)
      
      // End loading state on error
      setUploadingStops(prev => {
        const newSet = new Set(prev)
        newSet.delete(stopId)
        return newSet
      })
      
      // Fallback to local compression method if upload fails
      try {
        const compressedPhoto = await compressImage(file)
        setProgress(p => ({
          ...p,
          [stopId]: { ...currentState, photo: compressedPhoto, done: true, completedAt: new Date().toISOString() }
        }))
        console.log('📷 Fallback to local storage successful')
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        // Final fallback to FileReader
        const reader = new FileReader()
        reader.onloadend = () => {
          const photoData = reader.result
          setProgress(p => ({
            ...p,
            [stopId]: { ...currentState, photo: photoData, done: true, completedAt: new Date().toISOString() }
          }))
          
          setTimeout(() => {
            setTransitioningStops(prev => new Set([...prev, stopId]))
            setTimeout(() => {
              setTransitioningStops(prev => {
                const newSet = new Set(prev)
                newSet.delete(stopId)
                return newSet
              })
            }, 600)
          }, 150)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Compatibility wrapper: allow functional updater style for setProgress
  // Some components (e.g., StopsList) call setProgress((prev)=>next).
  // The store's setProgress expects an object, so we adapt here.
  const setProgressCompat = (next) => {
    if (typeof next === 'function') {
      const computed = next(progress)
      setProgress(computed)
    } else {
      setProgress(next)
    }
  }


  // Create real collage from completed stops using Cloudinary
  const createPrizeCollage = async () => {
    console.log('🎯 Starting prize collage creation...')
    setCollageLoading(true)
    
    try {
      // Get all completed stops with photos
      const completedStops = stops.filter(stop => progress[stop.id]?.photo)
      console.log('📸 Found', completedStops.length, 'completed stops with photos:', completedStops.map(s => s.title))
      
      if (completedStops.length === 0) {
        console.warn('⚠️ No completed stops found')
        console.warn('No completed stops with photos found!')
        return
      }

      // Convert base64 images to File objects
      console.log('🔄 Converting base64 images to File objects...')
      const files = completedStops.map((stop, index) => {
        const base64 = progress[stop.id].photo
        console.log(`  Converting ${stop.title}: base64 length = ${base64.length} characters`)
        const file = base64ToFile(base64, `vail-${stop.id}.jpg`)
        console.log(`  Created file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)
        return file
      })

      // Get titles
      const titles = completedStops.map(stop => stop.title)
      console.log('📝 Titles:', titles)

      console.log('☁️ Sending request to CollageService...')
      console.log('  Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })))
      console.log('  Titles:', titles)
      
      // Create collage using Cloudinary service
      const url = await CollageService.createCollage(files, titles)
      
      console.log('✅ Collage created successfully!')
      console.log('  URL:', url)
      setCollageUrl(url)
      setFullSizeImageUrl(url)
      
    } catch (error) {
      console.error('❌ Failed to create prize collage:', error)
      console.error('  Error name:', error.name)
      console.error('  Error message:', error.message)
      console.error('  Error stack:', error.stack)
      console.error(`Failed to create your prize collage: ${error.message}`)
    } finally {
      console.log('🏁 Prize collage creation finished')
      setCollageLoading(false)
    }
  }

  // Preview using 3 sample images from public/images and random titles
  const previewStorybook = async () => {
    const samplePhotos = [
      '/images/selfie-guide-1.png',
      '/images/selfie-guide-2.png',
      '/images/selfie-guide-3.png',
    ]
    // Random titles from current location data
    const shuffled = [...stops].sort(() => Math.random() - 0.5)
    const titles = shuffled.slice(0, 3).map(s => s.title)
    const url = await buildStorybook(samplePhotos, titles)
    setStorybookUrl(url)
  }

  // Team-specific reset - only resets data for the current team
  const reset = async () => {
    try {
      console.log(`🗑️ Resetting data for team: ${teamName || 'default'}`)
      
      // Reset progress data (team-specific)
      resetProgress()
      
      // Clear team photos (shared among team members)
      await PhotoUploadService.clearTeamPhotos(teamName, locationName, eventName)
      
      // Clear UI state (these are shared but will be regenerated)
      setCollageUrl(null)
      setStorybookUrl(null)
      setFullSizeImageUrl(null)
      setExpandedStops({})
      setTransitioningStops(new Set())
      
      console.log(`✅ Successfully reset data for team: ${teamName || 'default'}`)
      
    } catch (error) {
      console.error('❌ Failed to reset team data:', error)
    }
  }
  
  // Toggle expanded state for a stop
  const toggleExpanded = (stopId) => {
    setExpandedStops(prev => ({
      ...prev,
      [stopId]: !prev[stopId]
    }))
  }
  
  // Save settings handler
  const handleSaveSettings = async () => {
    try {
      // Save settings using DualWriteService
      const settingsData = {
        location: locationName,
        team: teamName,
        event: eventName,
        updatedAt: new Date().toISOString()
      }
      
      const results = await DualWriteService.saveSettings(settingsData)
      console.log('✅ Settings saved:', settingsData, results)
    } catch (error) {
      console.error('❌ Failed to save settings:', error)
    }
    
    setIsEditMode(false)
  }

  // Share progress via Web Share API if available; otherwise copy URL + summary to clipboard.
  const share = async () => {
    const text = `Vail Scavenger Hunt — ${completeCount}/${stops.length} stops complete!`
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      // Prefer native share dialogs on mobile for better UX.
      if (navigator.share) {
        await navigator.share({ title: 'Vail Scavenger Hunt', text, url })
      } else {
        // Fallback: copy text to clipboard and show toast notification.
        await navigator.clipboard.writeText(`${text} ${url}`)
        console.log('Link copied to clipboard ✨')
      }
    } catch (err) {
      console.warn('Failed to share or copy link', err)
      console.error('Failed to share or copy link')
    }
  }

  return (
    <UploadProvider 
      location={locationName}
      team={teamName}
      sessionId={sessionId}
      eventName={eventName}
    >
      <div className='min-h-screen text-slate-900 bg-gray-50'>
        {showSplash && (
          <SplashScreen
            onSelectEvent={(evt) => {
              if (evt.orgName) setLocationName(evt.orgName)
              if (evt.eventName) setEventName(evt.eventName)
              navigate('event')
              setShowSplash(false)
              requestOpenEventSettings()
            }}
            onSetupNew={() => {
              navigate('event')
              setShowSplash(false)
              requestOpenEventSettings()
            }}
            onClose={() => setShowSplash(false)}
          />
        )}

        <Header 
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
          completeCount={completeCount}
          totalStops={stops.length}
          percent={percent}
          onReset={reset}
          onToggleTips={() => setShowTips(!showTips)}
          onNavigate={navigate}
        />

        {/* Rules slide-up panel rendered at app level so it works on any page */}
        {showTips && (
          <div className='fixed inset-0 z-30'>
            <div 
              className='absolute inset-0 bg-black/40 backdrop-blur-sm' 
              onClick={()=>setShowTips(false)}
              style={{
                animation: 'fadeIn 0.2s ease-out forwards'
              }}
            />
            <div 
              className='absolute inset-x-0 bottom-0 rounded-t-3xl p-5 shadow-2xl pb-safe'
              style={{
                backgroundColor: 'var(--color-white)',
                animation: 'slideUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                marginBottom: '80px', // Offset for footer navigation
                maxHeight: 'calc(100vh - 160px)', // Ensure it doesn't exceed viewport
                overflowY: 'auto' // Allow scrolling if content is too long
              }}
            >
              <div className='mx-auto max-w-screen-sm'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold flex items-center gap-2' style={{ color: 'var(--color-cabernet)' }}>📖 Rules</h3>
                  <button 
                    className='p-2 rounded-lg transition-all duration-150 transform hover:scale-110 active:scale-95' style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-light-pink)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'} 
                    onClick={()=>setShowTips(false)}
                    aria-label='Close'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' style={{ color: 'var(--color-medium-grey)' }}>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
                <div className='mt-3 space-y-3 text-sm' style={{ color: 'var(--color-dark-neutral)' }}>
                  <p className='font-medium'>Navigate to each location and solve the clues to complete your scavenger hunt.</p>
                  
                  <div className='space-y-2'>
                    <p className='font-medium'>Competition goals:</p>
                    <ul className='list-disc pl-5 space-y-1'>
                      <li>Complete all locations to finish the hunt.</li>
                      <li>Use hints strategically to solve challenging clues.</li>
                    </ul>
                  </div>
                  
                  <p>Pay attention to your surroundings — details you notice along the way might help you solve the clues.</p>
                  
                  <p>Work together, explore strategically, and enjoy discovering Vail Village!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live region for screen reader announcements */}
        <div id="status-announcements" aria-live="polite" aria-atomic="true" className="sr-only"></div>
        
        {/* Conditional page rendering based on store navigation */}
        <>
        {currentPage === 'hunt' && (
        <div>
        <main id="main-content" className='max-w-screen-sm mx-auto px-4 py-2' 
              role="main" 
              aria-label="Scavenger hunt main content"
              style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>

        {/* Album Viewer Component */}
        <AlbumViewer 
          collageUrl={collageUrl}
          imageUrl={fullSizeImageUrl}
          initialExpanded={true}
        />

        {/* Top Tabs for Current vs Completed */}
        <div className='max-w-screen-sm mx-auto px-4 mt-6'>
          <div 
            role="tablist" 
            aria-label="Switch between current tasks and completed tasks"
            className='flex border-b'
            style={{ borderColor: 'var(--color-light-grey)' }}
          >
            <button
              role="tab"
              aria-selected={taskTab === 'current'}
              aria-controls="current-tabpanel"
              id="current-tab"
              tabIndex={taskTab === 'current' ? 0 : -1}
              className={`flex-1 px-4 py-4 text-center font-medium border-b-2 transition-all duration-200 ${
                taskTab === 'current' 
                  ? 'border-current font-semibold' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                color: taskTab === 'current' ? 'var(--color-cabernet)' : 'var(--color-medium-grey)',
                borderBottomColor: taskTab === 'current' ? 'var(--color-cabernet)' : 'transparent'
              }}
              onClick={() => setActiveTabWithHistory('current')}
              onKeyDown={handleTabKeyDown}
            >
              Current Tasks
            </button>
            <button
              role="tab"
              aria-selected={taskTab === 'completed'}
              aria-controls="completed-tabpanel"
              id="completed-tab"
              tabIndex={taskTab === 'completed' ? 0 : -1}
              className={`flex-1 px-4 py-4 text-center font-medium border-b-2 transition-all duration-200 ${
                taskTab === 'completed' 
                  ? 'border-current font-semibold' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                color: taskTab === 'completed' ? 'var(--color-cabernet)' : 'var(--color-medium-grey)',
                borderBottomColor: taskTab === 'completed' ? 'var(--color-cabernet)' : 'transparent'
              }}
              onClick={() => setActiveTabWithHistory('completed')}
              onKeyDown={handleTabKeyDown}
            >
              Completed ({stops.filter(stop => progress[stop.id]?.done && !transitioningStops.has(stop.id)).length})
            </button>
          </div>
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id="current-tabpanel"
          aria-labelledby="current-tab"
          hidden={taskTab !== 'current'}
          className="max-w-screen-sm mx-auto px-4 mt-3 space-y-2"
        >
          <StopsList
          stops={stops}
          progress={progress}
          transitioningStops={transitioningStops}
          completedSectionExpanded={completedSectionExpanded}
          onToggleCompletedSection={() => setCompletedSectionExpanded(!completedSectionExpanded)}
          expandedStops={expandedStops}
          onToggleExpanded={toggleExpanded}
          uploadingStops={uploadingStops}
          onPhotoUpload={handlePhotoUpload}
          setProgress={setProgressCompat}
          view="current"
        />
        </div>

        {/* Completed Tab Panel */}
        <div
          role="tabpanel"
          id="completed-tabpanel"
          aria-labelledby="completed-tab"
          hidden={taskTab !== 'completed'}
          className="max-w-screen-sm mx-auto px-4 mt-3 space-y-2"
        >
          <StopsList
            stops={stops}
            progress={progress}
            transitioningStops={transitioningStops}
            completedSectionExpanded={completedSectionExpanded}
            onToggleCompletedSection={() => setCompletedSectionExpanded(!completedSectionExpanded)}
            expandedStops={expandedStops}
            onToggleExpanded={toggleExpanded}
            uploadingStops={uploadingStops}
            onPhotoUpload={handlePhotoUpload}
            setProgress={setProgressCompat}
            view="completed"
          />
        </div>


        

      </main>
        
        {/* Mobile Footer Navigation */}
        <FooterNav 
          activePage="challenges"
          progressPercent={percent}
          completeCount={completeCount}
          totalStops={stops.length}
          onEventClick={() => {
            // Navigate to event page
            navigate('event')
          }}
          onChallengesClick={() => {
            // Navigate to hunt/challenges page
            navigate('hunt')
          }}
          onSocialClick={() => {
            // Navigate to social/feed page
            navigate('feed')
          }}
        />
        </div>
        )}
        
        {/* Feed Page */}
        {currentPage === 'feed' && (
          <FeedPage 
            onNavigate={navigate}
            percent={percent}
            completeCount={completeCount}
            totalStops={stops.length}
          />
        )}

        {/* Event Page */}
        {currentPage === 'event' && (
          <EventPage 
            onNavigate={navigate}
            completeCount={completeCount}
            totalStops={stops.length}
            percent={percent}
            stops={stops}
            progress={progress}
            onSaveSettings={handleSaveSettings}
          />
        )}
        </>
        
      </div>
    </UploadProvider>
  )
}
