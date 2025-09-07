import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Preview state type for Phase 1
export interface PhotoPreview {
  objectUrl?: string
  dataUrl?: string
  fileMeta?: {
    name: string
    type: string
    size: number
  }
  savedLocally: boolean
  savedAt?: number
}

// Progress state type
export interface StopProgress {
  done: boolean
  notes: string
  photo: string | null
  revealedHints: number
  completedAt?: string
  preview?: PhotoPreview
}

interface ProgressState {
  progress: Record<string, StopProgress>
}

interface ProgressActions {
  setProgress: (progress: Record<string, StopProgress>) => void
  updateStopProgress: (stopId: string, progressData: StopProgress) => void
  resetProgress: () => void
  resetHints: () => void // Reset all revealed hints to 1
  // Preview actions (Phase 1)
  selectPhoto: (stopId: string, file: File) => void
  cancelPreview: (stopId: string) => void
  // Phase 3: Hydration action for restoring ObjectURLs
  hydratePreviewsFromStorage: () => void
}

type ProgressStore = ProgressState & ProgressActions

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      // State
      progress: {},
      
      // Actions
      setProgress: (progress: Record<string, StopProgress>) => set({ progress }),
      
      updateStopProgress: (stopId: string, progressData: StopProgress) => set((state) => ({
        progress: {
          ...state.progress,
          [stopId]: progressData
        }
      })),
      
      resetProgress: () => set({ progress: {} }),
      
      resetHints: () => set((state) => {
        console.log(`🔄 RESETTING HINTS: Resetting all revealed hints to 1`)
        const resetProgress = { ...state.progress }
        
        // Reset revealedHints to 1 for all stops while preserving other progress
        Object.keys(resetProgress).forEach(stopId => {
          resetProgress[stopId] = {
            ...resetProgress[stopId],
            revealedHints: 1
          }
        })
        
        console.log(`🔄 HINTS RESET COMPLETE: ${Object.keys(resetProgress).length} stops reset`)
        return { progress: resetProgress }
      }),
      
      // Preview actions (Phase 3: Local Persistence)
      selectPhoto: (stopId: string, file: File) => {
        console.log(`📷 PREVIEW: Selecting photo for ${stopId}:`, { name: file.name, type: file.type, size: file.size })
        
        // Phase 3: Create both ObjectURL (for immediate display) and DataURL (for persistence)
        const objectUrl = URL.createObjectURL(file)
        
        // Convert to DataURL for localStorage persistence
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          
          set((state) => {
            // Clean up any existing objectUrl for this stop to prevent leaks
            const existingPreview = state.progress[stopId]?.preview
            if (existingPreview?.objectUrl) {
              URL.revokeObjectURL(existingPreview.objectUrl)
            }
            
            const preview: PhotoPreview = {
              objectUrl, // For immediate display
              dataUrl,   // For persistence
              fileMeta: {
                name: file.name,
                type: file.type,
                size: file.size
              },
              savedLocally: true,
              savedAt: Date.now()
            }
            
            return {
              progress: {
                ...state.progress,
                [stopId]: {
                  ...state.progress[stopId],
                  done: false,
                  notes: state.progress[stopId]?.notes || '',
                  photo: null,
                  revealedHints: state.progress[stopId]?.revealedHints || 1,
                  preview
                }
              }
            }
          })
        }
        
        // Phase 3: Optional image resizing before storing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // Calculate dimensions for resizing (max 800px width/height)
          const maxSize = 800
          let { width, height } = img
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw resized image
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                reader.readAsDataURL(blob)
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          )
        }
        
        img.src = objectUrl
      },
      
      // Phase 3: Hydration action for restoring ObjectURLs from persisted DataURLs
      hydratePreviewsFromStorage: () => {
        // No-op in current implementation. If needed, we could traverse state.progress
        // and reconstruct object URLs from persisted data URLs. Left intentionally light
        // to satisfy the interface and keep logic centralized in components that need it.
        console.log('🧪 hydratePreviewsFromStorage invoked (no-op)')
      },
      
      cancelPreview: (stopId: string) => {
        console.log(`🗑️ PREVIEW: Cancelling preview for ${stopId}`)
        
        set((state) => {
          const existingPreview = state.progress[stopId]?.preview
          
          // Clean up objectUrl to prevent memory leaks
          if (existingPreview?.objectUrl) {
            URL.revokeObjectURL(existingPreview.objectUrl)
          }
          
          return {
            progress: {
              ...state.progress,
              [stopId]: {
                ...state.progress[stopId],
                done: state.progress[stopId]?.done || false,
                notes: state.progress[stopId]?.notes || '',
                photo: state.progress[stopId]?.photo || null,
                revealedHints: state.progress[stopId]?.revealedHints || 1,
                preview: undefined
              }
            }
          }
        })
      }
    }),
    {
      name: 'progress-store', // localStorage key
      partialize: (state) => ({
        progress: state.progress
      })
    }
  )
)