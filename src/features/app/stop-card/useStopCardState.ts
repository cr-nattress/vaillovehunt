import { useMemo } from 'react'
import { PLACEHOLDER_IMAGE } from './stopCard.tokens'

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

interface UseStopCardStateProps {
  stop: Stop
  progress: Record<string, StopProgress>
  uploadingStops: Set<string>
  transitioningStops: Set<string>
  index: number
}

export function useStopCardState({ 
  stop, 
  progress, 
  uploadingStops, 
  transitioningStops, 
  index 
}: UseStopCardStateProps) {
  // Memoize expensive calculations
  const state = useMemo(() => {
    const progressState = progress[stop.id] || { done: false, notes: '', photo: null, revealedHints: 1 }
    console.log(`🎯 STOPCARD RENDER: stopId=${stop.id}, photo=${progressState.photo ? progressState.photo.split('/').pop() : 'none'}, done=${progressState.done}, revealedHints=${progressState.revealedHints}, totalHints=${stop.hints.length}`)
    return progressState
  }, [progress, stop.id, stop.hints.length])
  
  const displayImage = useMemo(() => {
    const image = state.photo || PLACEHOLDER_IMAGE
    console.log(`🖼️ STOPCARD IMAGE: stopId=${stop.id}, using=${image === PLACEHOLDER_IMAGE ? 'placeholder' : 'photo: ' + image.split('/').pop()}`)
    return image
  }, [state.photo, stop.id])

  const isTransitioning = useMemo(() => 
    transitioningStops.has(stop.id), 
    [transitioningStops, stop.id]
  )
  
  const isUploading = useMemo(() => 
    uploadingStops.has(stop.id), 
    [uploadingStops, stop.id]
  )

  return {
    state,
    displayImage,
    isTransitioning,
    isUploading
  }
}