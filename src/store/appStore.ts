import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Photo record type
export interface PhotoRecord {
  photoUrl: string
  publicId: string
  locationSlug: string
  title: string
  uploadedAt: string
  locationId: string
}

// Navigation types
export type PageType = 'hunt' | 'feed' | 'event'
export type TaskTab = 'current' | 'completed'

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

interface AppState {
  locationName: string
  teamName: string
  sessionId: string
  eventName: string
  lockedByQuery: boolean
  // UI intents
  openEventSettingsOnce?: boolean
  
  // Navigation state (Phase 1 - Mirror Mode)
  currentPage: PageType
  taskTab: TaskTab
  
  // Progress state (per stop)
  progress: Record<string, StopProgress>
  
  // Team photos (properly structured by org/event/team)
  teamPhotos: Record<string, Record<string, Record<string, PhotoRecord[]>>> // [org][event][team]: PhotoRecord[]
}

interface AppActions {
  setLocationName: (locationName: string) => void
  setTeamName: (teamName: string) => void
  setSessionId: (sessionId: string) => void
  setEventName: (eventName: string) => void
  setLockedByQuery: (locked: boolean) => void
  
  // Navigation actions (Phase 1 - Mirror Mode)
  navigate: (page: PageType) => void
  setTaskTab: (tab: TaskTab) => void
  
  // Progress actions
  setProgress: (progress: Record<string, StopProgress>) => void
  updateStopProgress: (stopId: string, progressData: StopProgress) => void
  resetProgress: () => void
  
  // Preview actions (Phase 1)
  selectPhoto: (stopId: string, file: File) => void
  cancelPreview: (stopId: string) => void
  
  // Photo actions
  saveTeamPhoto: (locationName: string, eventName: string, teamName: string, photo: PhotoRecord) => void
  getTeamPhotos: (locationName: string, eventName: string, teamName: string) => PhotoRecord[]
  clearTeamPhotos: (locationName: string, eventName: string, teamName: string) => void
  clearAllTeamData: () => void
  
  // Team switching
  switchTeam: (newTeamName: string) => void
  
  // Phase 3: Hydration action for restoring ObjectURLs
  hydratePreviewsFromStorage: () => void

  // UI intents
  requestOpenEventSettings: () => void
  clearOpenEventSettings: () => void
}

type AppStore = AppState & AppActions

// Generate a unique session ID (GUID)
const generateSessionId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // State
      locationName: 'BHHS',
      teamName: '',
      sessionId: generateSessionId(),
      eventName: 'Vail',
      lockedByQuery: false,
      openEventSettingsOnce: false,
      
      // Navigation state (Phase 1 - Mirror Mode)
      currentPage: 'hunt',
      taskTab: 'current',
      
      progress: {},
      teamPhotos: {},
      
      // Basic actions
      setLocationName: (locationName: string) => set({ locationName }),
      setTeamName: (teamName: string) => set({ teamName }),
      setSessionId: (sessionId: string) => set({ sessionId }),
      setEventName: (eventName: string) => set({ eventName }),
      setLockedByQuery: (locked: boolean) => set({ lockedByQuery: locked }),
      
      // Navigation actions (Phase 6 - Final with validation)
      navigate: (page: PageType) => {
        console.log(`🧭 Store Navigation: Setting page to ${page}`)
        
        // Phase 6: Validation with dev warnings
        if (process.env.NODE_ENV === 'development') {
          if (!['hunt', 'feed', 'event'].includes(page)) {
            console.warn(`⚠️ Invalid page value: ${page}. Must be 'hunt', 'feed', or 'event'.`)
            return
          }
        }
        
        set({ currentPage: page })
      },
      
      setTaskTab: (tab: TaskTab) => {
        console.log(`🧭 Store Navigation: Setting task tab to ${tab}`)
        
        // Phase 6: Validation with dev warnings
        if (process.env.NODE_ENV === 'development') {
          if (!['current', 'completed'].includes(tab)) {
            console.warn(`⚠️ Invalid task tab value: ${tab}. Must be 'current' or 'completed'.`)
            return
          }
        }
        
        set({ taskTab: tab })
      },
      
      // Progress actions
      setProgress: (progress: Record<string, StopProgress>) => set({ progress }),
      
      updateStopProgress: (stopId: string, progressData: StopProgress) => set((state) => ({
        progress: {
          ...state.progress,
          [stopId]: progressData
        }
      })),
      
      resetProgress: () => set({ progress: {} }),
      
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
      },
      
      // Photo actions
      saveTeamPhoto: (locationName: string, eventName: string, teamName: string, photo: PhotoRecord) => {
        console.log(`💾 ZUSTAND: Saving photo for org=${locationName}, event=${eventName}, team=${teamName}:`, photo);
        
        set((state) => {
          // Ensure nested structure exists
          const newTeamPhotos = { ...state.teamPhotos };
          if (!newTeamPhotos[locationName]) newTeamPhotos[locationName] = {};
          if (!newTeamPhotos[locationName][eventName]) newTeamPhotos[locationName][eventName] = {};
          
          const currentPhotos = newTeamPhotos[locationName][eventName][teamName] || [];
          
          // Remove any existing photo for this location (replace)
          const updatedPhotos = currentPhotos.filter(p => p.locationId !== photo.locationId);
          updatedPhotos.push(photo);
          
          newTeamPhotos[locationName][eventName][teamName] = updatedPhotos;
          
          console.log(`💾 ZUSTAND: Updated photos for org=${locationName}, event=${eventName}, team=${teamName}:`, updatedPhotos);
          
          return { teamPhotos: newTeamPhotos };
        });
      },
      
      getTeamPhotos: (locationName: string, eventName: string, teamName: string): PhotoRecord[] => {
        const state = get();
        const photos = state.teamPhotos[locationName]?.[eventName]?.[teamName] || [];
        
        console.log(`📊 ZUSTAND: Getting photos for org=${locationName}, event=${eventName}, team=${teamName}:`, photos);
        
        return photos;
      },
      
      clearTeamPhotos: (locationName: string, eventName: string, teamName: string) => {
        console.log(`🗑️ ZUSTAND: Clearing photos for org=${locationName}, event=${eventName}, team=${teamName}`);
        
        set((state) => {
          const newTeamPhotos = { ...state.teamPhotos };
          if (newTeamPhotos[locationName]?.[eventName]?.[teamName]) {
            delete newTeamPhotos[locationName][eventName][teamName];
          }
          
          return { teamPhotos: newTeamPhotos };
        });
      },
      
      clearAllTeamData: () => {
        console.log(`🧹 ZUSTAND: Clearing all team data`);
        set({ progress: {}, teamPhotos: {} });
      },
      
      // Team switching - clear progress but keep all team photos
      switchTeam: (newTeamName: string) => {
        console.log(`🔄 ZUSTAND: Switching to team ${newTeamName} - clearing progress but keeping photos`);
        
        set((state) => {
          // Load photos for new team into progress
          const { locationName, eventName } = state;
          const teamPhotos = state.teamPhotos[locationName]?.[eventName]?.[newTeamName] || [];
          
          // Convert photos to progress entries
          const newProgress: Record<string, StopProgress> = {};
          teamPhotos.forEach(photo => {
            newProgress[photo.locationId] = {
              done: true,
              notes: '',
              photo: photo.photoUrl,
              completedAt: photo.uploadedAt,
              revealedHints: 1
            };
          });
          
          console.log(`🔄 ZUSTAND: Loaded ${teamPhotos.length} photos for org=${locationName}, event=${eventName}, team=${newTeamName}:`, newProgress);
          
          return {
            teamName: newTeamName,
            progress: newProgress
          };
        });
      },

      // UI intents: allow other components to open the Event settings panel once
      requestOpenEventSettings: () => set({ openEventSettingsOnce: true }),
      clearOpenEventSettings: () => set({ openEventSettingsOnce: false })
    }),
    {
      name: 'vail-hunt-store', // localStorage key
      partialize: (state) => ({ 
        locationName: state.locationName,
        teamName: state.teamName,
        sessionId: state.sessionId,
        eventName: state.eventName,
        progress: state.progress,
        teamPhotos: state.teamPhotos,
        // Phase 5: Persist navigation state
        currentPage: state.currentPage,
        taskTab: state.taskTab
      })
    }
  )
)