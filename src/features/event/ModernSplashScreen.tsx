import React, { useEffect, useState } from 'react'
import { fetchTodaysEvents, OrgEvent } from '../../services/EventService'
import MountainLogo from '../../components/MountainLogo'
import { slugify } from '../../utils/slug'
import { orgRegistryService } from '../../services/OrgRegistryService'
import { MediaUploadService } from '../../client/MediaUploadService'
import { useToastActions } from '../notifications/ToastProvider'

interface ModernSplashScreenProps {
  onSelectEvent: (evt: OrgEvent, teamName?: string) => void
  onSetupNew: () => void
  onClose?: () => void
  initialStep?: 'events' | 'new-org'
}

// Mock team data
const MOCK_TEAMS = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE']

export default function ModernSplashScreen({ onSelectEvent, onSetupNew, onClose, initialStep = 'events' }: ModernSplashScreenProps) {
  const { warning: showWarningToast } = useToastActions()
  const [events, setEvents] = useState<OrgEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [step, setStep] = useState<'events' | 'teams' | 'form' | 'new-org' | 'new-hunt' | 'new-steps' | 'review-submit'>(initialStep)
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
  const [huntFormData, setHuntFormData] = useState({
    huntName: '',
    huntDate: '',
    city: '',
    state: '',
    zip: ''
  })
  const [huntFormErrors, setHuntFormErrors] = useState({
    huntName: '',
    huntDate: '',
    city: '',
    state: '',
    zip: ''
  })
  const [stepsData, setStepsData] = useState<{
    id: string
    title: string
    hints: string[]
    media?: File
    mediaType?: 'image' | 'video'
  }[]>([])
  const [stepsErrors, setStepsErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Media validation constants
  const MAX_IMAGE_SIZE = 12 * 1024 * 1024 // 12MB
  const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

  // Media validation functions
  const isValidMediaFile = (file: File): { isValid: boolean; error?: string; mediaType?: 'image' | 'video' } => {
    if (!file) return { isValid: false, error: 'No file provided' }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return { isValid: false, error: 'File must be an image or video' }
    }

    const mediaType = isImage ? 'image' : 'video'
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    const sizeLimit = isImage ? '12MB' : '200MB'

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be under ${sizeLimit}` }
    }

    return { isValid: true, mediaType }
  }

  // Media preview component
  const MediaPreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
    const isVideo = file.type.startsWith('video/')
    const fileUrl = URL.createObjectURL(file)
    
    return (
      <div className="relative">
        {isVideo ? (
          <video 
            src={fileUrl}
            className="w-20 h-20 object-cover rounded-lg border border-white/20"
            controls={false}
            muted
            onLoadedMetadata={(e) => {
              // Auto-generate poster by seeking to 1 second
              const video = e.target as HTMLVideoElement
              video.currentTime = 1
            }}
          />
        ) : (
          <img 
            src={fileUrl}
            alt="Step preview"
            className="w-20 h-20 object-cover rounded-lg border border-white/20"
          />
        )}
        <div className="absolute -top-1 -right-1">
          <button
            type="button"
            onClick={onRemove}
            className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors"
            aria-label="Remove media"
          >
            ×
          </button>
        </div>
        <div className="mt-1 text-xs text-white/60 text-center">
          {isVideo ? '🎥' : '🖼️'} {(file.size / 1024 / 1024).toFixed(1)}MB
        </div>
      </div>
    )
  }

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

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
  }

  const validateState = (state: string): boolean => {
    return state.length === 2 && /^[A-Z]{2}$/.test(state.toUpperCase())
  }

  const validateZip = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip)
  }

  const addNewStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: '',
      hints: ['']
    }
    setStepsData(prev => [...prev, newStep])
  }

  const removeStep = (index: number) => {
    setStepsData(prev => prev.filter((_, i) => i !== index))
  }

  const moveStepUp = (index: number) => {
    if (index === 0) return
    setStepsData(prev => {
      const newSteps = [...prev]
      const temp = newSteps[index]
      newSteps[index] = newSteps[index - 1]
      newSteps[index - 1] = temp
      return newSteps
    })
  }

  const moveStepDown = (index: number) => {
    if (index === stepsData.length - 1) return
    setStepsData(prev => {
      const newSteps = [...prev]
      const temp = newSteps[index]
      newSteps[index] = newSteps[index + 1]
      newSteps[index + 1] = temp
      return newSteps
    })
  }

  const updateStepTitle = (index: number, title: string) => {
    setStepsData(prev => prev.map((step, i) => 
      i === index ? { ...step, title } : step
    ))
  }

  const updateStepHint = (stepIndex: number, hintIndex: number, hint: string) => {
    setStepsData(prev => prev.map((step, i) => 
      i === stepIndex ? {
        ...step,
        hints: step.hints.map((h, hi) => hi === hintIndex ? hint : h)
      } : step
    ))
  }

  const addStepHint = (stepIndex: number) => {
    setStepsData(prev => prev.map((step, i) => 
      i === stepIndex ? {
        ...step,
        hints: [...step.hints, '']
      } : step
    ))
  }

  const removeStepHint = (stepIndex: number, hintIndex: number) => {
    setStepsData(prev => prev.map((step, i) => 
      i === stepIndex ? {
        ...step,
        hints: step.hints.filter((_, hi) => hi !== hintIndex)
      } : step
    ))
  }

  const updateStepMedia = (stepIndex: number, file: File | null) => {
    if (!file) {
      // Clear media
      setStepsData(prev => prev.map((step, i) => 
        i === stepIndex ? {
          ...step,
          media: undefined,
          mediaType: undefined
        } : step
      ))
      return
    }

    // Validate file
    const validation = isValidMediaFile(file)
    if (!validation.isValid) {
      showWarningToast(validation.error || 'Invalid file', { duration: 4000 })
      return
    }

    // Update step with validated media
    setStepsData(prev => prev.map((step, i) => 
      i === stepIndex ? {
        ...step,
        media: file,
        mediaType: validation.mediaType
      } : step
    ))
  }

  const validateStepsForm = (): boolean => {
    const errors: string[] = []

    if (stepsData.length === 0) {
      errors.push('At least one step is required')
    }

    stepsData.forEach((step, index) => {
      if (!step.title.trim()) {
        errors[index] = `Step ${index + 1}: Title is required`
      } else if (step.hints.length === 0 || !step.hints.some(h => h.trim())) {
        errors[index] = `Step ${index + 1}: At least one hint is required`
      }
    })

    setStepsErrors(errors)
    return errors.length === 0
  }

  const isStepsFormValid = (): boolean => {
    return stepsData.length > 0 && 
           stepsData.every(step => 
             step.title.trim() !== '' && 
             step.hints.some(h => h.trim() !== '')
           )
  }

  // Non-side-effect validation functions for render
  const isHuntFormValidForRender = (): boolean => {
    return (
      huntFormData.huntName.trim() !== '' &&
      huntFormData.huntDate.trim() !== '' &&
      validateDate(huntFormData.huntDate) &&
      huntFormData.city.trim() !== '' &&
      huntFormData.state.trim() !== '' &&
      validateState(huntFormData.state) &&
      huntFormData.zip.trim() !== '' &&
      validateZip(huntFormData.zip)
    )
  }

  const isStepsFormValidForRender = (): boolean => {
    return stepsData.length > 0 && 
           stepsData.every(step => 
             step.title.trim() !== '' && 
             step.hints.some(h => h.trim() !== '')
           )
  }

  const handleHuntFormChange = (field: keyof typeof huntFormData, value: string) => {
    setHuntFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (huntFormErrors[field]) {
      setHuntFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateHuntForm = (): boolean => {
    const errors = {
      huntName: '',
      huntDate: '',
      city: '',
      state: '',
      zip: ''
    }
    let isValid = true

    if (!huntFormData.huntName.trim()) {
      errors.huntName = 'Hunt name is required'
      isValid = false
    }

    if (!huntFormData.huntDate.trim()) {
      errors.huntDate = 'Hunt date is required'
      isValid = false
    } else if (!validateDate(huntFormData.huntDate)) {
      errors.huntDate = 'Please enter a valid date (YYYY-MM-DD)'
      isValid = false
    }

    if (!huntFormData.city.trim()) {
      errors.city = 'City is required'
      isValid = false
    }

    if (!huntFormData.state.trim()) {
      errors.state = 'State is required'
      isValid = false
    } else if (!validateState(huntFormData.state)) {
      errors.state = 'Please enter a valid 2-letter state code (e.g., CO)'
      isValid = false
    }

    if (!huntFormData.zip.trim()) {
      errors.zip = 'ZIP code is required'
      isValid = false
    } else if (!validateZip(huntFormData.zip)) {
      errors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
      isValid = false
    }

    setHuntFormErrors(errors)
    return isValid
  }

  const isHuntFormValid = (): boolean => {
    return (
      huntFormData.huntName.trim() !== '' &&
      huntFormData.huntDate.trim() !== '' &&
      validateDate(huntFormData.huntDate) &&
      huntFormData.city.trim() !== '' &&
      huntFormData.state.trim() !== '' &&
      validateState(huntFormData.state) &&
      huntFormData.zip.trim() !== '' &&
      validateZip(huntFormData.zip)
    )
  }

  const handleHuntFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateHuntForm()) {
      // Navigate to steps creation instead of directly creating hunt
      setStep('new-steps')
    }
  }

  const handleStepsFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStepsForm()) {
      setStep('review-submit')
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateHuntForm() && validateStepsForm()) {
      setIsSubmitting(true)
      try {
        const orgSlug = slugify(orgFormData.organizationName)
        const createdAt = new Date().toISOString()
        const createdBy = `${orgFormData.firstName} ${orgFormData.lastName}`
        
        console.log('🎯 ModernSplashScreen: Creating new hunt and organization:', {
          orgName: orgFormData.organizationName,
          huntName: huntFormData.huntName,
          huntDate: huntFormData.huntDate,
          orgSlug,
          createdBy,
          createdAt,
          contactDetails: {
            firstName: orgFormData.firstName,
            lastName: orgFormData.lastName,
            email: orgFormData.email
          }
        })
        
        // Create the event object for navigation
        const newEvent: OrgEvent = {
          key: `events/${huntFormData.huntDate}/${orgSlug}`,
          orgSlug,
          orgName: orgFormData.organizationName,
          eventName: huntFormData.huntName,
          startAt: huntFormData.huntDate,
          endAt: huntFormData.huntDate,
          data: { 
            description: `${huntFormData.huntName} - ${orgFormData.organizationName}`,
            createdBy,
            createdByEmail: orgFormData.email,
            createdAt
          }
        }
        
        console.log('🚀 ModernSplashScreen: Created event object for navigation:', newEvent)
        
        // Navigate immediately (non-blocking)
        onSelectEvent(newEvent)
        
        // Persist to blob storage in background (fire-and-forget)
        console.log('🔄 ModernSplashScreen: Starting background blob persistence...')
        persistHuntToBlobs(orgSlug, createdBy, createdAt).catch(error => {
          console.error('❌ ModernSplashScreen: Background persistence failed:', error)
          showWarningToast('Hunt created successfully, but saving to storage failed', { duration: 6000 })
        })
      } catch (error) {
        console.error('❌ ModernSplashScreen: Failed to create hunt:', error)
        showWarningToast('Failed to create hunt. Please try again.', { duration: 6000 })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const persistHuntToBlobs = async (orgSlug: string, createdBy: string, createdAt: string) => {
    try {
      console.log('💾 ModernSplashScreen: Starting blob persistence process:', {
        orgSlug,
        orgName: orgFormData.organizationName,
        huntName: huntFormData.huntName,
        huntDate: huntFormData.huntDate,
        createdBy,
        createdAt
      })
      
      // Create contact object
      const contact = {
        firstName: orgFormData.firstName,
        lastName: orgFormData.lastName,
        email: orgFormData.email
      }
      console.log('👤 ModernSplashScreen: Created contact object:', contact)
      
      // Load or create App JSON
      let appData
      try {
        console.log('📖 ModernSplashScreen: Attempting to load existing App JSON...')
        const appResult = await orgRegistryService.loadApp()
        appData = appResult.data
        console.log('✅ ModernSplashScreen: Loaded existing App JSON with', appData.organizations.length, 'organizations')
      } catch (error) {
        // Create default app data if not found
        console.log('🆕 ModernSplashScreen: App JSON not found, creating default structure')
        appData = {
          schemaVersion: '1.0.0',
          updatedAt: createdAt,
          app: {
            metadata: { name: 'Vail Hunt', environment: 'development' },
            features: { enableKVEvents: false, enableBlobEvents: false, enablePhotoUpload: true, enableMapPage: false },
            defaults: { timezone: 'America/Denver', locale: 'en-US' }
          },
          organizations: []
        }
        console.log('📋 ModernSplashScreen: Created default App JSON:', appData)
      }
      
      // Load or create Org JSON
      let orgData
      try {
        console.log(`📖 ModernSplashScreen: Attempting to load existing Org JSON for ${orgSlug}...`)
        const orgResult = await orgRegistryService.loadOrg(orgSlug)
        orgData = orgResult.data
        console.log(`✅ ModernSplashScreen: Loaded existing Org JSON with ${orgData.hunts.length} hunts`)
      } catch (error) {
        // Create new organization
        console.log(`🆕 ModernSplashScreen: Org ${orgSlug} not found, creating new organization`)
        orgData = orgRegistryService.createNewOrg(
          orgSlug,
          orgFormData.organizationName,
          [contact]
        )
      }
      
      // Create the new hunt
      console.log('🎯 ModernSplashScreen: Creating new hunt object...')
      const huntLocation = {
        city: huntFormData.city,
        state: huntFormData.state,
        zip: huntFormData.zip
      }
      const newHunt = orgRegistryService.createNewHunt(
        huntFormData.huntName,
        huntFormData.huntDate,
        huntFormData.huntDate,
        createdBy,
        huntLocation
      )
      
      // TODO: Upload media files before creating stops
      // In a full implementation, we would:
      // 1. Loop through stepsData and upload any step.media files
      // 2. Use MediaUploadService.uploadMedia() for each file
      // 3. Store the returned URLs in the assets array
      // 4. Handle upload failures gracefully (warn user but continue)
      
      // Convert steps to hunt stops
      console.log('📍 ModernSplashScreen: Converting steps to hunt stops...')
      console.log('🎬 Found', stepsData.filter(s => s.media).length, 'steps with media files')
      const stops = stepsData.map((step, index) => {
        // Prepare assets array for media content
        const assets = []
        if (step.media && step.mediaType) {
          // Note: In a full implementation, we would upload the media first
          // and use the returned URL. For now, we'll create a placeholder
          const assetType = step.mediaType === 'video' ? 'video' : 'image'
          assets.push({
            type: assetType as 'image' | 'video' | 'audio',
            url: '', // Placeholder - would be filled after media upload
            caption: `${step.mediaType === 'video' ? 'Video' : 'Image'} for ${step.title}`
          })
        }

        // Set requirements based on media type
        const requirements = [{ 
          type: (step.mediaType || 'photo') as 'photo' | 'video' | 'text', 
          required: true,
          description: step.mediaType === 'video' ? 'Record a video at this location' : 'Take a photo at this location'
        }]

        return {
          id: `stop-${index + 1}`,
          title: step.title,
          lat: 0, // Placeholder - will be set when locations are assigned
          lng: 0, // Placeholder - will be set when locations are assigned 
          radiusMeters: 50,
          description: `Step ${index + 1}: ${step.title}`,
          hints: step.hints.filter(h => h.trim()).map(text => ({ text })),
          requirements,
          assets,
          audit: {
            createdBy,
            createdAt: new Date().toISOString()
          }
        }
      })
      
      // Add stops to hunt
      newHunt.stops = stops
      console.log(`✅ ModernSplashScreen: Added ${stops.length} stops to hunt`)
      console.log('📋 Hunt stops:', stops.map(s => ({ id: s.id, title: s.title, hintCount: s.hints.length })))
      
      // Add hunt to org data
      console.log('➕ ModernSplashScreen: Adding hunt to organization data...')
      orgData = await orgRegistryService.addHuntToOrg(orgData, newHunt)
      
      // Update organization summary in app data
      console.log('🔄 ModernSplashScreen: Updating organization summary in App JSON...')
      const orgSummary = {
        orgSlug,
        orgName: orgFormData.organizationName,
        primaryContactEmail: orgFormData.email,
        createdAt,
        orgBlobKey: `orgs/${orgSlug}.json`
      }
      console.log('📋 ModernSplashScreen: Organization Summary:', orgSummary)
      appData = await orgRegistryService.addOrganization(appData, orgSummary)
      
      // Update date index
      console.log('📅 ModernSplashScreen: Updating date index in App JSON...')
      appData = await orgRegistryService.updateByDateIndex(
        appData,
        huntFormData.huntDate,
        orgSlug,
        newHunt.id
      )
      
      // Save both records
      console.log('💾 ModernSplashScreen: Saving Org JSON and App JSON to blob storage...')
      await orgRegistryService.upsertOrg(orgData, orgSlug)
      await orgRegistryService.upsertApp(appData)
      
      console.log('✅ ModernSplashScreen: Successfully persisted all data to blob storage:', {
        orgSlug,
        huntId: newHunt.id,
        orgHuntCount: orgData.hunts.length,
        appOrgCount: appData.organizations.length,
        dateIndexEntries: appData.byDate?.[huntFormData.huntDate]?.length || 0
      })
    } catch (error) {
      console.error('❌ Failed to persist hunt to blob storage:', error)
      throw error
    }
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
      <div className="relative z-10 h-full flex flex-col mx-auto p-4 sm:p-6 text-center" style={{
        maxWidth: ['new-steps', 'review-submit'].includes(step) ? '48rem' : '32rem'
      }}>
        {/* Fixed Header Section */}
        <div className="flex-shrink-0">
          {/* Logo section - hide during hunt setup */}
          {!['new-org', 'new-hunt', 'new-steps', 'review-submit'].includes(step) && (
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

          {/* Welcome message */}
          <div className="mb-6 fade-in-up-animation" style={{ animationDelay: '0.3s' }}>
            {/* Progress indicator for setup flow */}
            {['new-org', 'new-hunt', 'new-steps', 'review-submit'].includes(step) && (
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {['new-org', 'new-hunt', 'new-steps', 'review-submit'].map((s, index) => (
                    <div key={s} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        s === step ? 'bg-white/30 text-white ring-2 ring-white/50' :
                        ['new-org', 'new-hunt', 'new-steps', 'review-submit'].indexOf(step) > index ? 'bg-white/20 text-white' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {index + 1}
                      </div>
                      {index < 3 && (
                        <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                          ['new-org', 'new-hunt', 'new-steps', 'review-submit'].indexOf(step) > index ? 'bg-white/30' : 'bg-white/10'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-white/60 text-center">
                  Step {['new-org', 'new-hunt', 'new-steps', 'review-submit'].indexOf(step) + 1} of 4
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-3 mb-2">
              {(step === 'teams' || step === 'form' || step === 'new-org' || step === 'new-hunt' || step === 'new-steps' || step === 'review-submit') && (
                <button
                  onClick={
                    step === 'teams' ? handleBackToEvents :
                    step === 'form' ? handleBackToTeams :
                    step === 'new-org' ? handleBackToEvents :
                    step === 'new-hunt' ? () => setStep('new-org') :
                    step === 'new-steps' ? () => setStep('new-hunt') :
                    step === 'review-submit' ? () => setStep('new-steps') :
                    handleBackToEvents
                  }
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 group"
                  aria-label={
                    step === 'teams' ? 'Back to events' :
                    step === 'form' ? 'Back to teams' :
                    step === 'new-org' ? 'Back to events' :
                    step === 'new-hunt' ? 'Back to organization setup' :
                    step === 'new-steps' ? 'Back to hunt details' :
                    step === 'review-submit' ? 'Back to steps setup' :
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
                 step === 'new-steps' ? 'Build Your Hunt Steps' :
                 step === 'review-submit' ? 'Review & Submit' :
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
                : step === 'new-steps'
                ? 'Create the steps participants will complete during your hunt adventure.'
                : step === 'review-submit'
                ? 'Review all details and submit to create your adventure.'
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
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className="form-field"
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
                    className="form-field"
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
                    className="form-field"
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
            <form onSubmit={handleOrgFormSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Organization Name */}
                <div>
                  <input
                    type="text"
                    id="organizationName"
                    required
                    value={orgFormData.organizationName}
                    onChange={(e) => handleOrgFormChange('organizationName', e.target.value)}
                    className={`form-field ${
                      orgFormErrors.organizationName ? 'error-field' : ''
                    }`}
                    placeholder="Organization name"
                    aria-invalid={orgFormErrors.organizationName ? 'true' : 'false'}
                  />
                  {orgFormErrors.organizationName && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
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
                    className={`form-field ${
                      orgFormErrors.firstName ? 'error-field' : ''
                    }`}
                    placeholder="First name"
                    aria-invalid={orgFormErrors.firstName ? 'true' : 'false'}
                  />
                  {orgFormErrors.firstName && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
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
                    className={`form-field ${
                      orgFormErrors.lastName ? 'error-field' : ''
                    }`}
                    placeholder="Last name"
                    aria-invalid={orgFormErrors.lastName ? 'true' : 'false'}
                  />
                  {orgFormErrors.lastName && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
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
                    className={`form-field ${
                      orgFormErrors.email ? 'error-field' : ''
                    }`}
                    placeholder="Email address"
                    aria-invalid={orgFormErrors.email ? 'true' : 'false'}
                  />
                  {orgFormErrors.email && (
                    <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
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
            <div className="space-y-6">
              {/* Organization Summary */}
              <div className="summary-card mb-4">
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

              {/* Hunt Creation Form */}
              <form onSubmit={handleHuntFormSubmit} className="space-y-4">
                <div className="space-y-4">
                  {/* Hunt Name */}
                  <div>
                    <input
                      type="text"
                      id="huntName"
                      required
                      value={huntFormData.huntName}
                      onChange={(e) => handleHuntFormChange('huntName', e.target.value)}
                      className={`form-field ${
                        huntFormErrors.huntName ? 'error-field' : ''
                      }`}
                      placeholder="Hunt name (e.g., Mountain Adventure 2025)"
                      aria-invalid={huntFormErrors.huntName ? 'true' : 'false'}
                    />
                    {huntFormErrors.huntName && (
                      <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                        {huntFormErrors.huntName}
                      </p>
                    )}
                  </div>

                  {/* Hunt Date */}
                  <div>
                    <input
                      type="date"
                      id="huntDate"
                      required
                      value={huntFormData.huntDate}
                      onChange={(e) => handleHuntFormChange('huntDate', e.target.value)}
                      className={`form-field ${
                        huntFormErrors.huntDate ? 'error-field' : ''
                      }`}
                      aria-invalid={huntFormErrors.huntDate ? 'true' : 'false'}
                    />
                    {huntFormErrors.huntDate && (
                      <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                        {huntFormErrors.huntDate}
                      </p>
                    )}
                  </div>

                  {/* Location Fields */}
                  <div className="space-y-4">
                    {/* City */}
                    <div>
                      <input
                        type="text"
                        id="city"
                        required
                        value={huntFormData.city}
                        onChange={(e) => handleHuntFormChange('city', e.target.value)}
                        className={`form-field ${
                          huntFormErrors.city ? 'error-field' : ''
                        }`}
                        placeholder="City (e.g., Vail)"
                        aria-invalid={huntFormErrors.city ? 'true' : 'false'}
                      />
                      {huntFormErrors.city && (
                        <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                          {huntFormErrors.city}
                        </p>
                      )}
                    </div>

                    {/* State and ZIP in a row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          id="state"
                          required
                          maxLength={2}
                          value={huntFormData.state}
                          onChange={(e) => handleHuntFormChange('state', e.target.value.toUpperCase())}
                          className={`form-field ${
                            huntFormErrors.state ? 'error-field' : ''
                          }`}
                          placeholder="State (CO)"
                          aria-invalid={huntFormErrors.state ? 'true' : 'false'}
                        />
                        {huntFormErrors.state && (
                          <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                            {huntFormErrors.state}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          id="zip"
                          required
                          value={huntFormData.zip}
                          onChange={(e) => handleHuntFormChange('zip', e.target.value)}
                          className={`form-field ${
                            huntFormErrors.zip ? 'error-field' : ''
                          }`}
                          placeholder="ZIP (81657)"
                          aria-invalid={huntFormErrors.zip ? 'true' : 'false'}
                        />
                        {huntFormErrors.zip && (
                          <p className="error-message" role="alert">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                            {huntFormErrors.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!isHuntFormValid()}
                    className={`w-full group relative overflow-hidden font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl transition-all duration-300 modern-action-button ${
                      isHuntFormValid() 
                        ? 'text-white hover:shadow-2xl transform hover:scale-105' 
                        : 'text-white/50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>Create Adventure</span>
                      <svg className={`w-5 h-5 transition-transform ${isHuntFormValid() ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    {isHuntFormValid() && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      />
                    )}
                  </button>
                </div>
              </form>
              
              {/* Preview Note */}
              <div className="text-center">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60">
                    Creating your adventure will take you to the event page where you can add locations and challenges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'new-steps' && (
            <div className="space-y-6">
              {/* Hunt Summary */}
              <div className="summary-card mb-4">
                <h4 className="text-sm font-medium text-white/90 mb-3">Hunt Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Hunt Name:</span>
                    <span className="text-white">{huntFormData.huntName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Date:</span>
                    <span className="text-white">{huntFormData.huntDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Location:</span>
                    <span className="text-white">{huntFormData.city}, {huntFormData.state} {huntFormData.zip}</span>
                  </div>
                </div>
              </div>

              {/* Steps Form */}
              <form onSubmit={handleStepsFormSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* Steps List */}
                  <div className="space-y-4">
                    {stepsData.length === 0 ? (
                      <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-white/60 mb-4">
                          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          No steps created yet
                        </div>
                        <p className="text-white/40 text-sm mb-4">Create your first hunt step to get started</p>
                        <button
                          type="button"
                          onClick={addNewStep}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Add First Step
                        </button>
                      </div>
                    ) : (
                      <>
                        {stepsData.map((step, index) => (
                          <div key={step.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-4">
                              <h5 className="text-white font-medium">Step {index + 1}</h5>
                              <div className="flex items-center gap-2">
                                {/* Move Up/Down buttons */}
                                {stepsData.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => moveStepUp(index)}
                                      disabled={index === 0}
                                      className={`p-1 rounded ${index === 0 ? 'text-white/30 cursor-not-allowed' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                      aria-label="Move step up"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveStepDown(index)}
                                      disabled={index === stepsData.length - 1}
                                      className={`p-1 rounded ${index === stepsData.length - 1 ? 'text-white/30 cursor-not-allowed' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                      aria-label="Move step down"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => removeStep(index)}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                  aria-label="Remove step"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Step Title */}
                            <div className="mb-4">
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => updateStepTitle(index, e.target.value)}
                                placeholder="Step title (e.g., Find the red mailbox)"
                                className="form-field"
                                required
                              />
                            </div>

                            {/* Hints */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-white/80">Hints</label>
                                {step.hints.length < 3 && (
                                  <button
                                    type="button"
                                    onClick={() => addStepHint(index)}
                                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    + Add Hint
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {step.hints.map((hint, hintIndex) => (
                                  <div key={hintIndex} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={hint}
                                      onChange={(e) => updateStepHint(index, hintIndex, e.target.value)}
                                      placeholder={`Hint ${hintIndex + 1}`}
                                      className="form-field flex-1 text-sm"
                                      required={hintIndex === 0}
                                    />
                                    {step.hints.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeStepHint(index, hintIndex)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                                        aria-label={`Remove hint ${hintIndex + 1}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Optional Media Upload (Image or Video) */}
                            <div>
                              <label className="text-sm text-white/80 mb-2 block">Optional Media</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={(e) => updateStepMedia(index, e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`step-media-${index}`}
                                />
                                <label
                                  htmlFor={`step-media-${index}`}
                                  className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                >
                                  {step.media ? 'Change Media' : 'Add Image/Video'}
                                </label>
                                {step.media && (
                                  <>
                                    <span className="text-white/70 text-sm">
                                      {step.mediaType === 'video' ? '🎥' : '🖼️'} {step.media.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateStepMedia(index, null)}
                                      className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                      Clear
                                    </button>
                                  </>
                                )}
                              </div>
                              {step.media && (
                                <div className="mt-3">
                                  <MediaPreview 
                                    file={step.media} 
                                    onRemove={() => updateStepMedia(index, null)} 
                                  />
                                </div>
                              )}
                              <div className="mt-2 text-xs text-white/50">
                                Images: JPEG, PNG, GIF, WebP (max 12MB)<br/>
                                Videos: MP4, WebM, OGG, QuickTime (max 200MB)
                              </div>
                            </div>

                            {/* Step-specific Error */}
                            {stepsErrors[index] && (
                              <div className="error-message mt-3" role="alert">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {stepsErrors[index]}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Another Step Button */}
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={addNewStep}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Another Step
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Form Errors */}
                  {stepsErrors.length > 0 && stepsErrors.some(error => error && !error.startsWith('Step')) && (
                    <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-200">
                      {stepsErrors.filter(error => error && !error.startsWith('Step')).map((error, index) => (
                        <div key={index} role="alert">{error}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                {stepsData.length > 0 && (
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={!isStepsFormValid()}
                      className={`w-full group relative overflow-hidden font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl transition-all duration-300 modern-action-button ${
                        isStepsFormValid() 
                          ? 'text-white hover:shadow-2xl transform hover:scale-105' 
                          : 'text-white/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <span>Continue to Review</span>
                        <svg className={`w-5 h-5 transition-transform ${isStepsFormValid() ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      {isStepsFormValid() && (
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        />
                      )}
                    </button>
                  </div>
                )}
              </form>

              {/* Instructions */}
              <div className="text-center">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60">
                    Create 1-10 steps that participants will complete. Each step needs a title and at least one hint. Images and videos are optional but help guide participants.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'review-submit' && (
            <div className="space-y-6">
              {/* Final Review */}
              <div className="space-y-4">
                {/* Organization Summary */}
                <div className="summary-card">
                  <h4 className="text-sm font-medium text-white/90 mb-3">Organization</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Name:</span>
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

                {/* Hunt Details Summary */}
                <div className="summary-card">
                  <h4 className="text-sm font-medium text-white/90 mb-3">Hunt Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Hunt Name:</span>
                      <span className="text-white">{huntFormData.huntName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Date:</span>
                      <span className="text-white">{huntFormData.huntDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Location:</span>
                      <span className="text-white">{huntFormData.city}, {huntFormData.state} {huntFormData.zip}</span>
                    </div>
                  </div>
                </div>

                {/* Steps Summary */}
                <div className="summary-card">
                  <h4 className="text-sm font-medium text-white/90 mb-3">Hunt Steps ({stepsData.length})</h4>
                  <div className="space-y-3">
                    {stepsData.map((step, index) => (
                      <div key={step.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm mb-1">{step.title}</div>
                            <div className="text-white/60 text-xs mb-2">
                              {step.hints.filter(h => h.trim()).length} hint{step.hints.filter(h => h.trim()).length !== 1 ? 's' : ''}
                              {step.media && (
                                <span className="ml-2">
                                  • Has {step.mediaType === 'video' ? 'video 🎥' : 'image 🖼️'}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {step.hints.filter(h => h.trim()).map((hint, hintIndex) => (
                                <div key={hintIndex} className="text-white/50 text-xs">
                                  • {hint}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Form */}
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                {/* Final Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!isHuntFormValidForRender() || !isStepsFormValidForRender() || isSubmitting}
                    className={`w-full group relative overflow-hidden font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl transition-all duration-300 modern-action-button ${
                      (isHuntFormValidForRender() && isStepsFormValidForRender() && !isSubmitting)
                        ? 'text-white hover:shadow-2xl transform hover:scale-105' 
                        : 'text-white/50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Creating Adventure...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Adventure</span>
                          <svg className={`w-5 h-5 transition-transform ${(isHuntFormValidForRender() && isStepsFormValidForRender()) ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                    {(isHuntFormValidForRender() && isStepsFormValidForRender()) && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      />
                    )}
                  </button>
                </div>
              </form>

              {/* Final Instructions */}
              <div className="text-center">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60">
                    Ready to create your adventure? This will set up your organization and hunt, then take you to the event page where participants can join and start their journey.
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
        
        /* Improved scrollbar styling */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced form field styling */
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
        
        /* Summary card improvements */
        .summary-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          padding: 1rem;
        }
        
        /* Enhanced error styling */
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
        
        /* Button enhancements */
        .modern-action-button:not(:disabled):hover {
          transform: translateY(-1px) scale(1.02);
        }
        
        .modern-action-button:not(:disabled):active {
          transform: translateY(0) scale(0.98);
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