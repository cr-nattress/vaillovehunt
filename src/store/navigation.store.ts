import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Navigation types
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

type NavigationStore = NavigationState & NavigationActions

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      // State
      currentPage: 'hunt',
      taskTab: 'current',
      
      // Actions
      navigate: (page: PageType) => {
        console.log(`🧭 Navigation Store: Setting page to ${page}`)
        
        // Validation with dev warnings
        if (process.env.NODE_ENV === 'development') {
          if (!['hunt', 'feed', 'event'].includes(page)) {
            console.warn(`⚠️ Invalid page value: ${page}. Must be 'hunt', 'feed', or 'event'.`)
            return
          }
        }
        
        set({ currentPage: page })
      },
      
      setTaskTab: (tab: TaskTab) => {
        console.log(`🧭 Navigation Store: Setting task tab to ${tab}`)
        
        // Validation with dev warnings
        if (process.env.NODE_ENV === 'development') {
          if (!['current', 'completed'].includes(tab)) {
            console.warn(`⚠️ Invalid task tab value: ${tab}. Must be 'current' or 'completed'.`)
            return
          }
        }
        
        set({ taskTab: tab })
      }
    }),
    {
      name: 'nav-store', // localStorage key
      partialize: (state) => ({
        currentPage: state.currentPage,
        taskTab: state.taskTab
      })
    }
  )
)