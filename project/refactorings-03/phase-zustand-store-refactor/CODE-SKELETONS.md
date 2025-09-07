# Code Skeletons — Slices and Multi-Store

Use these ready-made skeletons to accelerate the refactor. Copy into `src/store/` and adjust.

---

## A) Multiple Stores by Domain

```ts
// src/store/navigation.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageType = 'hunt' | 'feed' | 'event'
export type TaskTab = 'current' | 'completed'

interface NavigationState {
  currentPage: PageType
  taskTab: TaskTab
}

interface NavigationActions {
  navigate: (page: PageType) => void
  setTaskTab: (tab: TaskTab) => void
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
  persist(
    (set) => ({
      currentPage: 'hunt',
      taskTab: 'current',
      navigate: (page) => set({ currentPage: page }),
      setTaskTab: (tab) => set({ taskTab: tab }),
    }),
    { name: 'nav-store', partialize: (s) => ({ currentPage: s.currentPage, taskTab: s.taskTab }) }
  )
)
```

```ts
// src/store/event.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EventState {
  locationName: string
  eventName: string
  teamName: string
  lockedByQuery: boolean
  openEventSettingsOnce: boolean
}

interface EventActions {
  setLocationName: (s: string) => void
  setEventName: (s: string) => void
  setTeamName: (s: string) => void
  setLockedByQuery: (b: boolean) => void
  requestOpenEventSettings: () => void
  clearOpenEventSettings: () => void
}

export const useEventStore = create<EventState & EventActions>()(
  persist(
    (set) => ({
      locationName: 'BHHS',
      eventName: 'Vail',
      teamName: '',
      lockedByQuery: false,
      openEventSettingsOnce: false,
      setLocationName: (locationName) => set({ locationName }),
      setEventName: (eventName) => set({ eventName }),
      setTeamName: (teamName) => set({ teamName }),
      setLockedByQuery: (lockedByQuery) => set({ lockedByQuery }),
      requestOpenEventSettings: () => set({ openEventSettingsOnce: true }),
      clearOpenEventSettings: () => set({ openEventSettingsOnce: false }),
    }),
    { name: 'event-store', partialize: (s) => ({ locationName: s.locationName, eventName: s.eventName, teamName: s.teamName, lockedByQuery: s.lockedByQuery, openEventSettingsOnce: s.openEventSettingsOnce }) }
  )
)
```

```ts
// src/store/progress.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StopProgress {
  done: boolean
  notes: string
  photo: string | null
  revealedHints: number
  completedAt?: string
  preview?: {
    objectUrl?: string
    dataUrl?: string
    fileMeta?: { name: string; type: string; size: number }
    savedLocally: boolean
    savedAt?: number
  }
}

interface ProgressState {
  progress: Record<string, StopProgress>
}

interface ProgressActions {
  setProgress: (p: Record<string, StopProgress>) => void
  updateStopProgress: (id: string, p: StopProgress) => void
  resetProgress: () => void
  selectPhoto: (id: string, file: File) => void
  cancelPreview: (id: string) => void
  hydratePreviewsFromStorage: () => void
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      progress: {},
      setProgress: (progress) => set({ progress }),
      updateStopProgress: (id, p) => set((s) => ({ progress: { ...s.progress, [id]: p } })),
      resetProgress: () => set({ progress: {} }),
      selectPhoto: (id, file) => {/* impl copied from current appStore */},
      cancelPreview: (id) => {/* impl copied from current appStore */},
      hydratePreviewsFromStorage: () => {/* no-op or reconstruct URLs */},
    }),
    { name: 'progress-store' }
  )
)
```

```ts
// src/store/photos.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PhotoRecord {
  photoUrl: string
  publicId: string
  locationSlug: string
  title: string
  uploadedAt: string
  locationId: string
}

interface PhotosState {
  teamPhotos: Record<string, Record<string, Record<string, PhotoRecord[]>>> // [org][event][team]
}

interface PhotosActions {
  saveTeamPhoto: (org: string, event: string, team: string, photo: PhotoRecord) => void
  getTeamPhotos: (org: string, event: string, team: string) => PhotoRecord[]
  clearTeamPhotos: (org: string, event: string, team: string) => void
  clearAllTeamData: () => void
  switchTeam: (newTeamName: string) => void
}

export const usePhotosStore = create<PhotosState & PhotosActions>()(
  persist(
    (set, get) => ({
      teamPhotos: {},
      saveTeamPhoto: (org, evt, team, photo) => {
        set((s) => {
          const next = { ...s.teamPhotos }
          next[org] ||= {}
          next[org][evt] ||= {}
          const cur = next[org][evt][team] || []
          const updated = cur.filter((p) => p.locationId !== photo.locationId).concat(photo)
          next[org][evt][team] = updated
          return { teamPhotos: next }
        })
      },
      getTeamPhotos: (org, evt, team) => get().teamPhotos[org]?.[evt]?.[team] || [],
      clearTeamPhotos: (org, evt, team) => set((s) => {
        const next = { ...s.teamPhotos }
        if (next[org]?.[evt]?.[team]) delete next[org][evt][team]
        return { teamPhotos: next }
      }),
      clearAllTeamData: () => set({ teamPhotos: {} }),
      switchTeam: (newTeamName) => {/* optionally move to service to also touch progress */},
    }),
    { name: 'photos-store' }
  )
)
```

```ts
// src/store/session.store.ts (optional)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState { sessionId: string }
interface SessionActions { setSessionId: (id: string) => void }

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      sessionId: crypto.randomUUID(),
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    { name: 'session-store' }
  )
)
```

---

## B) Single Store with Slices

```ts
// src/store/slices/navigation.slice.ts
import type { StateCreator } from 'zustand'
export type PageType = 'hunt' | 'feed' | 'event'
export type TaskTab = 'current' | 'completed'
export interface NavigationSlice { currentPage: PageType; taskTab: TaskTab; navigate: (p: PageType) => void; setTaskTab: (t: TaskTab) => void }
export const createNavigationSlice: StateCreator<NavigationSlice> = (set) => ({ currentPage: 'hunt', taskTab: 'current', navigate: (p) => set({ currentPage: p }), setTaskTab: (t) => set({ taskTab: t }) })
```

```ts
// src/store/createAppStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNavigationSlice, NavigationSlice } from './slices/navigation.slice'
// import other slices...

export type AppStore = NavigationSlice /* & EventSlice & ProgressSlice & PhotosSlice */

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createNavigationSlice(set, get, api),
      // ...other slices
    }),
    { name: 'vail-hunt-store', partialize: (s) => ({ currentPage: s.currentPage, taskTab: s.taskTab }) }
  )
)
```
