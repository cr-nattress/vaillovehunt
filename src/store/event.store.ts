import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EventState {
  locationName: string
  eventName: string
  teamName: string
  lockedByQuery: boolean
  // UI intents
  openEventSettingsOnce?: boolean
}

interface EventActions {
  setLocationName: (locationName: string) => void
  setEventName: (eventName: string) => void
  setTeamName: (teamName: string) => void
  setLockedByQuery: (locked: boolean) => void
  // UI intents
  requestOpenEventSettings: () => void
  clearOpenEventSettings: () => void
}

type EventStore = EventState & EventActions

export const useEventStore = create<EventStore>()(
  persist(
    (set) => ({
      // State
      locationName: 'BHHS',
      eventName: 'Vail',
      teamName: '',
      lockedByQuery: false,
      openEventSettingsOnce: false,
      
      // Actions
      setLocationName: (locationName: string) => set({ locationName }),
      setEventName: (eventName: string) => set({ eventName }),
      setTeamName: (teamName: string) => set({ teamName }),
      setLockedByQuery: (locked: boolean) => set({ lockedByQuery: locked }),
      
      // UI intents: allow other components to open the Event settings panel once
      requestOpenEventSettings: () => set({ openEventSettingsOnce: true }),
      clearOpenEventSettings: () => set({ openEventSettingsOnce: false })
    }),
    {
      name: 'event-store', // localStorage key
      partialize: (state) => ({
        locationName: state.locationName,
        eventName: state.eventName,
        teamName: state.teamName,
        lockedByQuery: state.lockedByQuery,
        openEventSettingsOnce: state.openEventSettingsOnce
      })
    }
  )
)