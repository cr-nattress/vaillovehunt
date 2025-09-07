import React, { memo, useMemo, useCallback } from 'react'
import ProgressRing from '../../components/ProgressRing'

const PLACEHOLDER = '/images/selfie-placeholder.svg'

// Enhanced challenge metadata functions
const getChallengeMetadata = (stop: Stop) => {
  const title = (stop.title || '').toLowerCase()
  const challenge = (stop.challenge || '').toLowerCase()
  
  // Difficulty rating (1-3 stars)
  let difficulty = 2 // default medium
  if (challenge.includes('photo') || challenge.includes('selfie')) difficulty = 1
  if (challenge.includes('find') || challenge.includes('locate')) difficulty = 2
  if (challenge.includes('creative') || challenge.includes('performance')) difficulty = 3
  
  // Challenge type icons
  let typeIcon = '🎯' // default
  let typeColor = '#6B7280' // default gray
  
  if (title.includes('village') || title.includes('park')) {
    typeIcon = '🏘️'
    typeColor = '#10B981' // green
  } else if (title.includes('mountain') || title.includes('gondola')) {
    typeIcon = '🏔️'
    typeColor = '#3B82F6' // blue
  } else if (title.includes('art') || title.includes('creative')) {
    typeIcon = '🎨'
    typeColor = '#8B5CF6' // purple
  } else if (title.includes('shop') || title.includes('store')) {
    typeIcon = '🏪'
    typeColor = '#F59E0B' // amber
  } else if (title.includes('restaurant') || title.includes('food')) {
    typeIcon = '🍽️'
    typeColor = '#EF4444' // red
  }
  
  // Estimated time (in minutes)
  let estimatedTime = 5 // default
  if (difficulty === 1) estimatedTime = 3
  if (difficulty === 3) estimatedTime = 8
  
  return {
    difficulty,
    typeIcon,
    typeColor,
    estimatedTime,
    difficultyStars: '⭐'.repeat(difficulty)
  }
}

// Enhanced hint system functions
const getHintMetadata = (hintText: string, hintIndex: number) => {
  const hint = (hintText || '').toLowerCase()
  
  // Categorize hint type
  let category = '💡' // default
  let categoryName = 'General'
  let categoryColor = '#6B7280'
  
  if (hint.includes('look') || hint.includes('find') || hint.includes('near') || hint.includes('behind')) {
    category = '📍'
    categoryName = 'Location'
    categoryColor = '#10B981'
  } else if (hint.includes('color') || hint.includes('shape') || hint.includes('see') || hint.includes('notice')) {
    category = '👀'
    categoryName = 'Visual'
    categoryColor = '#3B82F6'
  } else if (hint.includes('history') || hint.includes('built') || hint.includes('named') || hint.includes('fact')) {
    category = '📚'
    categoryName = 'History'
    categoryColor = '#8B5CF6'
  } else if (hint.includes('people') || hint.includes('ask') || hint.includes('local') || hint.includes('staff')) {
    category = '👥'
    categoryName = 'Social'
    categoryColor = '#F59E0B'
  }
  
  // Hint difficulty (gets progressively harder)
  const hintDifficulty = Math.min(hintIndex + 1, 3) // 1-3, with later hints being harder
  const costPoints = hintDifficulty // Cost in "points" for using this hint
  
  return {
    category,
    categoryName,
    categoryColor,
    difficulty: hintDifficulty,
    costPoints,
    difficultyLabel: hintDifficulty === 1 ? 'Easy' : hintDifficulty === 2 ? 'Medium' : 'Hard'
  }
}

interface Stop {
  id: string
  title: string
  emoji: string
  hints: string[]
  answer: string
  challenge: string
  funFact: string
  maps: string
  originalNumber?: number
}

interface StopProgress {
  done: boolean
  notes: string
  photo: string | null
  revealedHints: number
  completedAt?: string
}

interface StopCardProps {
  stop: Stop
  progress: Record<string, StopProgress>
  onUpload: (stopId: string, file: File) => Promise<void>
  onToggleExpanded: (stopId: string) => void
  expanded: boolean
  uploadingStops: Set<string>
  transitioningStops: Set<string>
  revealNextHint: () => void
  index: number
}

const StopCard = memo(function StopCard({
  stop,
  progress,
  onUpload,
  onToggleExpanded,
  expanded,
  uploadingStops,
  transitioningStops,
  revealNextHint,
  index
}: StopCardProps) {
  // Get challenge metadata
  const metadata = useMemo(() => getChallengeMetadata(stop), [stop])
  
  // Memoize expensive calculations
  const state = useMemo(() => {
    const progressState = progress[stop.id] || { done: false, notes: '', photo: null, revealedHints: 1 }
    console.log(`🎯 STOPCARD RENDER: stopId=${stop.id}, photo=${progressState.photo ? progressState.photo.split('/').pop() : 'none'}, done=${progressState.done}, revealedHints=${progressState.revealedHints}, totalHints=${stop.hints.length}`)
    return progressState
  }, [progress, stop.id])
  
  const displayImage = useMemo(() => {
    const image = state.photo || PLACEHOLDER
    console.log(`🖼️ STOPCARD IMAGE: stopId=${stop.id}, using=${image === PLACEHOLDER ? 'placeholder' : 'photo: ' + image.split('/').pop()}`)
    return image
  }, [state.photo, stop.id])
  const isTransitioning = useMemo(() => transitioningStops.has(stop.id), [transitioningStops, stop.id])
  const isUploading = useMemo(() => uploadingStops.has(stop.id), [uploadingStops, stop.id])

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await onUpload(stop.id, file)
    }
  }, [onUpload, stop.id])

  const handleToggleExpanded = useCallback(() => {
    if (state.done && !isTransitioning) {
      onToggleExpanded(stop.id)
    }
  }, [onToggleExpanded, stop.id, state.done, isTransitioning])

  return (
    <>
    <article 
      className={`mt-3 shadow-lg border rounded-xl p-3 transition-all duration-1000 ease-in-out ${
        state.done ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all focus:shadow-xl focus:ring-2 focus:ring-opacity-50' : 'hover:shadow-xl'
      }`}
      onClick={handleToggleExpanded}
      onKeyDown={(e) => {
        if (state.done && !isTransitioning && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleToggleExpanded()
        }
      }}
      tabIndex={state.done ? 0 : -1}
      role={state.done ? 'button' : 'article'}
      aria-expanded={state.done ? expanded : undefined}
      aria-label={state.done ? `${expanded ? 'Collapse' : 'Expand'} completed stop: ${stop.title}` : undefined}
      style={{
        backgroundColor: isTransitioning ? 'var(--color-light-pink)' : 'var(--color-white)',
        borderColor: isTransitioning 
          ? 'var(--color-success)' 
          : state.done 
            ? 'var(--color-blush-pink)'
            : `${metadata.typeColor}30`,
        borderWidth: isTransitioning ? '2px' : '1px',
        transform: isTransitioning ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `fadeInSlide 0.4s ease-out ${index * 0.15}s forwards`,
        opacity: 0
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {state.done ? (
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <ProgressRing 
                  number={stop.originalNumber ?? index + 1} 
                  isCompleted={false}
                  size={36}
                />
              )}
              <h3 className={`text-base font-semibold`} style={{ color: 'var(--color-cabernet)' }}>{stop.title}</h3>
            </div>
            {state.done && (
              <span style={{ color: 'var(--color-cabernet)' }}>
                {expanded ? '▼' : '▶'}
              </span>
            )}
            
            {/* Hint reveal button */}
            {(() => {
              const shouldShow = (!state.done || expanded) && state.revealedHints < stop.hints.length
              console.log(`🔘 HINT BUTTON: stopId=${stop.id}, shouldShow=${shouldShow}, state.done=${state.done}, expanded=${expanded}, revealedHints=${state.revealedHints}, totalHints=${stop.hints.length}`)
              return shouldShow
            })() && (
              <button
                onClick={(e) => {
                  console.log(`🔘 HINT BUTTON CLICKED: stopId=${stop.id}`)
                  e.stopPropagation()
                  e.preventDefault()
                  revealNextHint()
                }}
                style={{ 
                  backgroundColor: 'red', 
                  color: 'white', 
                  padding: '8px 12px', 
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  zIndex: 1000,
                  position: 'relative'
                }}
              >
                REVEAL HINT {state.revealedHints + 1}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </article>

    {/* Separated Hints Section - only for incomplete stops */}
    {(() => {
      const shouldShowHints = (!state.done || expanded)
      const hintsToShow = stop.hints.slice(0, state.revealedHints)
      console.log(`💡 HINTS SECTION: stopId=${stop.id}, shouldShowHints=${shouldShowHints}, hintsToShow=${hintsToShow.length}, state.done=${state.done}, expanded=${expanded}`)
      return shouldShowHints
    })() && (
      <div className='mt-2 space-y-1'>
        {stop.hints.slice(0, state.revealedHints).map((hint: string, hintIndex: number) => {
          const hintMetadata = getHintMetadata(hint, hintIndex)
          
          return (
            <div 
              key={hintIndex}
              className='border-l-4 p-2 rounded-r-xl transition-all duration-300 shadow-sm'
              style={{
                backgroundColor: `${hintMetadata.categoryColor}10`,
                borderColor: hintMetadata.categoryColor,
                animation: `slideInFromLeft 0.4s ease-out ${hintIndex * 0.1}s forwards`,
                opacity: 0
              }}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-2 flex-1'>
                  <span 
                    className='flex-shrink-0 w-7 h-7 text-white text-sm font-bold rounded-full flex items-center justify-center'
                    style={{ backgroundColor: hintMetadata.categoryColor }}
                  >
                    {hintMetadata.category}
                  </span>
                  <div className='flex-1'>
                    <p className='text-sm leading-snug mb-1' style={{ color: hintMetadata.categoryColor }}>
                      {hint}
                    </p>
                  </div>
                </div>
                
                {/* Hint metadata badges */}
                <div className='flex items-center gap-1 flex-shrink-0'>
                  <div className='px-2 py-1 rounded-full text-[10px] font-medium' style={{
                    backgroundColor: `${hintMetadata.categoryColor}20`,
                    color: hintMetadata.categoryColor
                  }}>
                    {hintMetadata.categoryName}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}

    {/* Separated Photo Upload Section */}
    {(!state.done || expanded) && (
      <div className='mt-2 rounded-xl border p-3 shadow-sm' style={{ backgroundColor: 'var(--color-white)' }}>
        {state.photo ? (
          <>
            <div className={`text-xs uppercase tracking-wide mb-2`} style={{ color: 'var(--color-success)' }}>
              ✅ Photo Complete
            </div>
            <img src={displayImage} alt={`Photo for ${stop.title}`} className='rounded-md object-cover w-full h-40 mb-2' onError={(e) => {(e.target as HTMLElement).style.display='none'}} />
            <div className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
              ✨ Your photo
            </div>
          </>
        ) : (
          <div className='flex items-center gap-2 text-xs text-slate-500 mb-2'>
            📷 Capture a creative selfie together at this location.
          </div>
        )}

        {!state.photo && (
          <div className='mt-3'>
            <input 
              type='file' 
              accept='image/*' 
              onChange={handlePhotoUpload}
              className='sr-only'
              id={`file-${stop.id}`}
              aria-describedby={`upload-help-${stop.id}`}
            />
            <label 
              htmlFor={`file-${stop.id}`}
              className={`w-full px-4 py-3 text-white font-medium rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 transform focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 focus:outline-none ${
                isUploading 
                  ? 'cursor-wait hover:scale-[1.02] active:scale-[0.98]' 
                  : 'hover:scale-[1.02] active:scale-[0.98]'
              }`} 
              style={{ backgroundColor: isUploading ? 'var(--color-warm-grey)' : 'var(--color-cabernet)' }} 
              onMouseEnter={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-hover)' }} 
              onMouseLeave={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet)' }}
              onFocus={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-hover)' }}
              onBlur={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet)' }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  document.getElementById(`file-${stop.id}`)?.click()
                }
              }}
              tabIndex={0}
              role="button"
              aria-disabled={isUploading}
              aria-label={isUploading ? 'Processing photo upload' : `Upload photo for ${stop.title}`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>📸 Upload Photo</>
              )}
            </label>
            <div id={`upload-help-${stop.id}`} className="sr-only">
              Select an image file to upload as your photo for this stop
            </div>
          </div>
        )}

        {state.done && (
          <div className='mt-3 flex items-center gap-2 text-sm italic' style={{ color: 'var(--color-cabernet)' }}>
            <span>❤</span> {stop.funFact}
          </div>
        )}
      </div>
    )}
    </>
  )
})

export default StopCard