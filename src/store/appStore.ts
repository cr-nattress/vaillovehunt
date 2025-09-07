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

// Navigation types moved to navigation.store.ts

// Progress and preview types moved to progress.store.ts

interface AppState {
  sessionId: string
  // Event identity and UI intents moved to event.store.ts
  
  // Navigation state moved to navigation.store.ts
  
  // Progress state moved to progress.store.ts
  
  // Team photos (properly structured by org/event/team)
  teamPhotos: Record<string, Record<string, Record<string, PhotoRecord[]>>> // [org][event][team]: PhotoRecord[]
}

interface AppActions {
  setSessionId: (sessionId: string) => void
  // Event actions moved to event.store.ts
  
  // Navigation actions moved to navigation.store.ts
  
  // Progress and preview actions moved to progress.store.ts
  
  // Photo actions
  saveTeamPhoto: (locationName: string, eventName: string, teamName: string, photo: PhotoRecord) => void
  getTeamPhotos: (locationName: string, eventName: string, teamName: string) => PhotoRecord[]
  clearTeamPhotos: (locationName: string, eventName: string, teamName: string) => void
  clearAllTeamData: () => void
  
  // Team switching (updated to accept event context and return team photos)
  switchTeam: (newTeamName: string, locationName: string, eventName: string) => PhotoRecord[]
  
  // Hydration action moved to progress.store.ts

  // UI intents moved to event.store.ts
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
      sessionId: generateSessionId(),
      // Event state moved to event.store.ts
      
      // Navigation state moved to navigation.store.ts
      // Progress state moved to progress.store.ts
      
      teamPhotos: {},
      
      // Basic actions
      setSessionId: (sessionId: string) => set({ sessionId }),
      // Event actions moved to event.store.ts
      
      // Navigation actions moved to navigation.store.ts
      
      // Progress and preview actions moved to progress.store.ts
      
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
        set({ teamPhotos: {} });
      },
      
      // Team switching - switched to just return team photos (progress handled in progress store)
      switchTeam: (newTeamName: string, locationName: string, eventName: string) => {
        console.log(`🔄 ZUSTAND: Switching to team ${newTeamName} - getting photos for the team`);
        
        const state = get();
        const teamPhotos = state.teamPhotos[locationName]?.[eventName]?.[newTeamName] || [];
        
        console.log(`🔄 ZUSTAND: Found ${teamPhotos.length} photos for org=${locationName}, event=${eventName}, team=${newTeamName}:`, teamPhotos);
        
        return teamPhotos; // Return photos so the caller can update progress store if needed
      },

      // UI intents moved to event.store.ts
    }),
    {
      name: 'vail-hunt-store', // localStorage key
      partialize: (state) => ({ 
        sessionId: state.sessionId,
        teamPhotos: state.teamPhotos
        // Progress state persisted in progress.store.ts
        // Event state persisted in event.store.ts
        // Navigation state persisted in navigation.store.ts
      })
    }
  )
)