import React, { memo, useCallback } from 'react'
import { useStopCardState } from './useStopCardState'
import StopCardHeader from './StopCardHeader'
import StopCardHints from './StopCardHints'
import StopCardMedia from './StopCardMedia'
import StopCardActions from './StopCardActions'
import StopCardCompletedMeta from './StopCardCompletedMeta'
import { COLORS, ANIMATIONS } from './stopCard.tokens'
import { useProgressStore } from '../../../store/progress.store'

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
  // Subscribe directly to the per-stop progress from the store to avoid stale props
  const stopProgress = useProgressStore(s => s.progress[stop.id])
  const state = stopProgress || { done: false, notes: '', photo: null, revealedHints: 1 }
  
  // DEBUG: Log state changes
  console.log(`🃏 STOPCARD RENDER: stopId=${stop.id}, revealedHints=${state.revealedHints}, done=${state.done}`)
  
  const { displayImage, isTransitioning, isUploading } = useStopCardState({
    stop,
    progress,
    uploadingStops,
    transitioningStops,
    index
  })

  // Memoize event handlers to prevent unnecessary re-renders
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
          backgroundColor: isTransitioning ? COLORS.lightPink : COLORS.white,
          borderColor: isTransitioning 
            ? COLORS.success 
            : state.done 
              ? COLORS.blushPink
              : `#6B728030`, // typeColor with opacity
          borderWidth: isTransitioning ? '2px' : '1px',
          transform: isTransitioning ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
          transition: ANIMATIONS.cardTransition,
          animation: `fadeInSlide 0.4s ease-out ${index * ANIMATIONS.fadeInDelay}s forwards`,
          opacity: 0
        }}
      >
        <StopCardHeader
          stop={stop}
          state={state}
          expanded={expanded}
          index={index}
          onRevealNextHint={revealNextHint}
          totalHints={stop.hints.length}
        />
      </article>

      {/* Separated Hints Section */}
      <StopCardHints 
        stop={stop}
        state={state}
        expanded={expanded}
      />

      {/* Separated Photo Upload Section */}
      <StopCardMedia 
        stop={stop}
        state={state}
        expanded={expanded}
        displayImage={displayImage}
      />

      {/* Photo Upload Actions */}
      {(!state.done || expanded) && (
        <StopCardActions
          stop={stop}
          state={state}
          expanded={expanded}
          isUploading={isUploading}
          onUpload={onUpload}
        />
      )}

      {/* Completed Meta */}
      <StopCardCompletedMeta
        stop={stop}
        state={state}
        expanded={expanded}
      />
    </>
  )
})

export default StopCard