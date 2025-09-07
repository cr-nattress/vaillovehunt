import React from 'react'
import StopCard from './stop-card/StopCard'
import CompletedAccordion from './CompletedAccordion'
import { useProgressStore } from '../../store/progress.store'

interface StopsListProps {
  stops: any[]
  progress: any
  transitioningStops: Set<string>
  completedSectionExpanded: boolean
  onToggleCompletedSection: () => void
  expandedStops: Record<string, boolean>
  onToggleExpanded: (stopId: string) => void
  uploadingStops: Set<string>
  onPhotoUpload: (stopId: string, file: File) => Promise<void>
  setProgress: (updateFn: any) => void
  view?: 'current' | 'completed'
}

export default function StopsList({
  stops,
  progress,
  transitioningStops,
  completedSectionExpanded,
  onToggleCompletedSection,
  expandedStops,
  onToggleExpanded,
  uploadingStops,
  onPhotoUpload,
  setProgress,
  view = 'current'
}: StopsListProps) {
  const { updateStopProgress } = useProgressStore()
  // Get completed stops sorted by completion timestamp (earliest first)
  const completedStops = stops
    .filter(stop => progress[stop.id]?.done && !transitioningStops.has(stop.id))
    .sort((a, b) => {
      const timeA = progress[a.id]?.completedAt || '0'
      const timeB = progress[b.id]?.completedAt || '0'
      return timeA.localeCompare(timeB)
    })
  
  const completedCount = completedStops.length
  
  // Create a completion order lookup
  const completionOrder: Record<string, number> = {}
  completedStops.forEach((stop, index) => {
    completionOrder[stop.id] = index + 1
  })
  
  // Assign numbers based on completion status and order
  const stopsWithNumbers = [...stops].map((stop) => {
    const isCompleted = progress[stop.id]?.done
    const isTransitioning = transitioningStops.has(stop.id)
    
    if (isCompleted && !isTransitioning) {
      // For completed stops, use their actual completion order
      return {
        ...stop,
        originalNumber: completionOrder[stop.id] || 1
      }
    } else {
      // For transitioning or current uncompleted stop, show as next in sequence
      return {
        ...stop,
        originalNumber: completedCount + 1
      }
    }
  })
  
  // Find the first incomplete stop (excluding transitioning ones)
  // Only show if there are no transitioning stops (wait for completion transition to finish)
  const firstIncomplete = transitioningStops.size === 0 
    ? stopsWithNumbers.find(stop => !(progress[stop.id]?.done))
    : null
  
  // Get transitioning stops (keep them in their current position)
  const transitioningStopsArray = stopsWithNumbers
    .filter(stop => transitioningStops.has(stop.id))
  
  // Show transitioning and first incomplete stop
  const activeStops: any[] = []
  activeStops.push(...transitioningStopsArray)
  if (firstIncomplete) {
    activeStops.push(firstIncomplete)
  }

  const handleRevealNextHint = (stopId: string) => {
    console.log(`🔍 REVEAL HINT FUNCTION: stopId=${stopId}`)
    const stop = stops.find(s => s.id === stopId)
    console.log(`🔍 Stop found:`, stop?.title)

    const currentState = progress[stopId] || { done: false, notes: '', photo: null, revealedHints: 1 }
    const canReveal = !!stop && currentState.revealedHints < (stop?.hints?.length || 0)
    console.log(`🔍 Current state:`, currentState)
    console.log(`🔍 Can reveal? ${canReveal}`)

    if (canReveal) {
      const nextState = { ...currentState, revealedHints: currentState.revealedHints + 1 }
      console.log(`🔍 REVEALING HINT: ${currentState.revealedHints} -> ${nextState.revealedHints}`)
      updateStopProgress(stopId, nextState)
      
      // Verify the update was applied to the store
      setTimeout(() => {
        const updatedState = useProgressStore.getState().progress[stopId]
        console.log(`✅ POST-UPDATE VERIFICATION: stopId=${stopId}, revealedHints=${updatedState?.revealedHints || 'undefined'}`)
        console.log(`✅ FULL STATE FOR STOP:`, updatedState)
      }, 0)
    } else {
      console.log(`🔍 No change, max hints reached or stop missing`)
    }
  }

  // Handle different view modes
  if (view === 'completed') {
    return (
      <CompletedAccordion
        completedStops={completedStops}
        expandedStops={expandedStops}
        progress={progress}
        onToggleExpanded={onToggleExpanded}
        completedSectionExpanded={true} // Auto-expand when in completed view
        onToggleCompletedSection={onToggleCompletedSection}
      />
    )
  }

  // Default view is 'current' - show active tasks only
  return (
    <>
      {/* Render active stops (current task) */}
      {activeStops.map((s, i) => (
        <StopCard
          key={s.id}
          stop={s}
          progress={progress}
          onUpload={onPhotoUpload}
          onToggleExpanded={onToggleExpanded}
          expanded={expandedStops[s.id] || false}
          uploadingStops={uploadingStops}
          transitioningStops={transitioningStops}
          revealNextHint={() => handleRevealNextHint(s.id)}
          index={i}
        />
      ))}
    </>
  )
}