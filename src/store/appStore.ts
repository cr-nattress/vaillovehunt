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

// Progress state type
export interface StopProgress {
  done: boolean
  notes: string
  photo: string | null
  revealedHints: number
  completedAt?: string
}

interface AppState {
  locationName: string
  teamName: string
  sessionId: string
  eventName: string
  lockedByQuery: boolean
  
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
  
  // Photo actions
  saveTeamPhoto: (locationName: string, eventName: string, teamName: string, photo: PhotoRecord) => void
  getTeamPhotos: (locationName: string, eventName: string, teamName: string) => PhotoRecord[]
  clearTeamPhotos: (locationName: string, eventName: string, teamName: string) => void
  clearAllTeamData: () => void
  
  // Team switching
  switchTeam: (newTeamName: string) => void
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
      }
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