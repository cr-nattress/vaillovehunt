import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

/**
 * Customer data interface for new customer flow
 */
export interface CustomerData {
  email: string
  firstName: string
  interests: string[]
  preferredLocation?: string
  eventType?: 'corporate' | 'family' | 'date' | 'friends'
  leadStatus?: 'prospect' | 'qualified' | 'converted'
  contactPreferences?: {
    email: boolean
    sms: boolean
    frequency: 'immediate' | 'weekly' | 'monthly'
  }
  source?: 'organic' | 'referral' | 'social' | 'advertising'
  createdAt?: string
  lastInteraction?: string
}

/**
 * Customer onboarding progress tracking
 */
export interface OnboardingProgress {
  currentStep: 'welcome' | 'interests' | 'details' | 'preferences' | 'completed'
  completedSteps: string[]
  startedAt: string
  completedAt?: string
  abandonedAt?: string
  resumeToken?: string
}

/**
 * Customer preferences and recommendations
 */
export interface CustomerPreferences {
  preferredEventTypes: string[]
  budgetRange?: 'budget' | 'standard' | 'premium'
  groupSize?: 'small' | 'medium' | 'large'
  experienceLevel?: 'beginner' | 'intermediate' | 'expert'
  locationPreferences: string[]
  timePreferences: string[]
  communicationStyle?: 'minimal' | 'regular' | 'detailed'
}

/**
 * Customer store state interface
 */
interface CustomerStoreState {
  // Current customer data
  currentCustomer: CustomerData | null
  
  // Onboarding flow state
  onboardingProgress: OnboardingProgress | null
  
  // Customer preferences
  preferences: CustomerPreferences | null
  
  // Lead management
  leads: CustomerData[]
  
  // UI state
  showNewCustomerFlow: boolean
  isOnboardingComplete: boolean
  
  // Actions
  setCurrentCustomer: (customer: CustomerData) => void
  updateCustomer: (updates: Partial<CustomerData>) => void
  clearCurrentCustomer: () => void
  
  // Onboarding flow actions
  startOnboarding: (source?: string) => void
  updateOnboardingProgress: (step: OnboardingProgress['currentStep']) => void
  completeOnboarding: () => void
  abandonOnboarding: () => void
  resumeOnboarding: (token: string) => boolean
  
  // Preferences actions
  updatePreferences: (preferences: Partial<CustomerPreferences>) => void
  getRecommendations: () => string[]
  
  // Lead management actions
  addLead: (customer: CustomerData) => void
  updateLead: (email: string, updates: Partial<CustomerData>) => void
  convertLead: (email: string) => void
  
  // UI actions
  showFlow: () => void
  hideFlow: () => void
  
  // Utility actions
  resetStore: () => void
  exportCustomerData: () => CustomerData | null
}

/**
 * Default customer preferences
 */
const defaultPreferences: CustomerPreferences = {
  preferredEventTypes: [],
  locationPreferences: ['vail', 'denver', 'boulder'],
  timePreferences: ['weekend', 'evening'],
  communicationStyle: 'regular'
}

/**
 * Create customer store with persistence
 */
export const useCustomerStore = create<CustomerStoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentCustomer: null,
        onboardingProgress: null,
        preferences: null,
        leads: [],
        showNewCustomerFlow: false,
        isOnboardingComplete: false,

        // Customer management actions
        setCurrentCustomer: (customer: CustomerData) => {
          console.log('👤 Setting current customer:', customer.email)
          set({
            currentCustomer: {
              ...customer,
              leadStatus: customer.leadStatus || 'prospect',
              createdAt: customer.createdAt || new Date().toISOString(),
              lastInteraction: new Date().toISOString()
            }
          })
        },

        updateCustomer: (updates: Partial<CustomerData>) => {
          const current = get().currentCustomer
          if (current) {
            const updated = {
              ...current,
              ...updates,
              lastInteraction: new Date().toISOString()
            }
            console.log('🔄 Updating current customer:', updates)
            set({ currentCustomer: updated })
          }
        },

        clearCurrentCustomer: () => {
          console.log('🗑️ Clearing current customer')
          set({ 
            currentCustomer: null, 
            onboardingProgress: null,
            isOnboardingComplete: false 
          })
        },

        // Onboarding flow actions
        startOnboarding: (source = 'organic') => {
          const progress: OnboardingProgress = {
            currentStep: 'welcome',
            completedSteps: [],
            startedAt: new Date().toISOString(),
            resumeToken: `onboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          console.log('🚀 Starting onboarding flow:', { source, token: progress.resumeToken })
          set({ 
            onboardingProgress: progress,
            showNewCustomerFlow: true,
            isOnboardingComplete: false 
          })
          
          // Update current customer with source
          const current = get().currentCustomer
          if (current) {
            get().updateCustomer({ source: source as CustomerData['source'] })
          }
        },

        updateOnboardingProgress: (step: OnboardingProgress['currentStep']) => {
          const current = get().onboardingProgress
          if (current) {
            const updatedSteps = current.completedSteps.includes(current.currentStep)
              ? current.completedSteps
              : [...current.completedSteps, current.currentStep]
            
            console.log('📋 Updating onboarding progress:', { from: current.currentStep, to: step })
            set({
              onboardingProgress: {
                ...current,
                currentStep: step,
                completedSteps: updatedSteps
              }
            })
          }
        },

        completeOnboarding: () => {
          const current = get().onboardingProgress
          const customer = get().currentCustomer
          
          if (current) {
            console.log('✅ Completing onboarding flow')
            set({
              onboardingProgress: {
                ...current,
                currentStep: 'completed',
                completedAt: new Date().toISOString(),
                completedSteps: [...current.completedSteps, current.currentStep]
              },
              isOnboardingComplete: true
            })
            
            // Add to leads if we have customer data
            if (customer) {
              get().addLead({ ...customer, leadStatus: 'qualified' })
            }
          }
        },

        abandonOnboarding: () => {
          const current = get().onboardingProgress
          if (current) {
            console.log('❌ Abandoning onboarding flow')
            set({
              onboardingProgress: {
                ...current,
                abandonedAt: new Date().toISOString()
              },
              showNewCustomerFlow: false
            })
          }
        },

        resumeOnboarding: (token: string) => {
          const current = get().onboardingProgress
          if (current && current.resumeToken === token) {
            console.log('🔄 Resuming onboarding flow:', token)
            set({ showNewCustomerFlow: true })
            return true
          }
          return false
        },

        // Preferences actions
        updatePreferences: (updates: Partial<CustomerPreferences>) => {
          const current = get().preferences || defaultPreferences
          const updated = { ...current, ...updates }
          console.log('⚙️ Updating customer preferences:', updates)
          set({ preferences: updated })
        },

        getRecommendations: () => {
          const customer = get().currentCustomer
          const preferences = get().preferences
          
          if (!customer || !preferences) return []
          
          const recommendations: string[] = []
          
          // Interest-based recommendations
          if (customer.interests.includes('adventure')) {
            recommendations.push('Mountain Photo Challenge', 'Outdoor Scavenger Hunt')
          }
          if (customer.interests.includes('team-building')) {
            recommendations.push('Corporate Team Challenge', 'Leadership Adventure')
          }
          if (customer.interests.includes('date-night')) {
            recommendations.push('Romantic Vail Discovery', 'Couples Photo Journey')
          }
          if (customer.interests.includes('family')) {
            recommendations.push('Family Fun Hunt', 'Multi-Generational Adventure')
          }
          
          // Event type recommendations
          if (customer.eventType === 'corporate') {
            recommendations.push('Professional Networking Hunt', 'Innovation Challenge')
          }
          
          console.log('💡 Generated recommendations:', recommendations.length)
          return recommendations.slice(0, 6) // Limit to top 6
        },

        // Lead management actions
        addLead: (customer: CustomerData) => {
          const leads = get().leads
          const existingIndex = leads.findIndex(lead => lead.email === customer.email)
          
          if (existingIndex >= 0) {
            // Update existing lead
            const updatedLeads = [...leads]
            updatedLeads[existingIndex] = {
              ...updatedLeads[existingIndex],
              ...customer,
              lastInteraction: new Date().toISOString()
            }
            console.log('🔄 Updated existing lead:', customer.email)
            set({ leads: updatedLeads })
          } else {
            // Add new lead
            const newLead = {
              ...customer,
              leadStatus: customer.leadStatus || 'prospect' as const,
              createdAt: customer.createdAt || new Date().toISOString(),
              lastInteraction: new Date().toISOString()
            }
            console.log('➕ Added new lead:', customer.email)
            set({ leads: [...leads, newLead] })
          }
        },

        updateLead: (email: string, updates: Partial<CustomerData>) => {
          const leads = get().leads
          const updatedLeads = leads.map(lead =>
            lead.email === email
              ? { ...lead, ...updates, lastInteraction: new Date().toISOString() }
              : lead
          )
          console.log('🔄 Updated lead:', email, updates)
          set({ leads: updatedLeads })
        },

        convertLead: (email: string) => {
          console.log('🎯 Converting lead:', email)
          get().updateLead(email, { leadStatus: 'converted' })
        },

        // UI actions
        showFlow: () => {
          console.log('🟢 showFlow called - showing unified flow')
          set({ showNewCustomerFlow: true })
        },
        hideFlow: () => {
          console.log('🔴 hideFlow called - hiding unified flow')
          console.trace('hideFlow call stack')
          set({ showNewCustomerFlow: false })
        },

        // Utility actions
        resetStore: () => {
          console.log('🔄 Resetting customer store')
          set({
            currentCustomer: null,
            onboardingProgress: null,
            preferences: null,
            leads: [],
            showNewCustomerFlow: false,
            isOnboardingComplete: false
          })
        },

        exportCustomerData: () => {
          const customer = get().currentCustomer
          console.log('📤 Exporting customer data')
          return customer
        }
      }),
      {
        name: 'customer-storage',
        partialize: (state) => ({
          currentCustomer: state.currentCustomer,
          preferences: state.preferences,
          leads: state.leads,
          onboardingProgress: state.onboardingProgress,
          isOnboardingComplete: state.isOnboardingComplete,
          showNewCustomerFlow: state.showNewCustomerFlow
        })
      }
    )
  )
)

/**
 * Selector hooks for common use cases
 */
export const useCurrentCustomer = () => useCustomerStore(state => state.currentCustomer)
export const useOnboardingProgress = () => useCustomerStore(state => state.onboardingProgress)
export const useCustomerPreferences = () => useCustomerStore(state => state.preferences)
export const useLeads = () => useCustomerStore(state => state.leads)
export const useNewCustomerFlow = () => useCustomerStore(state => state.showNewCustomerFlow)

/**
 * Debug helper for development
 */
export const debugCustomerStore = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const state = useCustomerStore.getState()
    console.group('🐛 Customer Store Debug')
    console.log('Current Customer:', state.currentCustomer)
    console.log('Onboarding Progress:', state.onboardingProgress)
    console.log('Preferences:', state.preferences)
    console.log('Leads Count:', state.leads.length)
    console.log('New Customer Flow Visible:', state.showNewCustomerFlow)
    console.groupEnd()
  }
}