import { useState, useEffect, useMemo } from 'react'

const STORAGE_KEY_PREFIX = 'vail-love-hunt-progress'

/**
 * useProgress
 * Manages per-stop completion and notes with localStorage persistence.
 * Now team-scoped to allow team-specific resets.
 * Returns { progress, setProgress, completeCount, percent }.
 */
export function useProgress(stops: any[], teamName: string = '') {
  // Create team-specific storage key
  const storageKey = teamName ? `${STORAGE_KEY_PREFIX}-${teamName}` : STORAGE_KEY_PREFIX
  const [progress, setProgress] = useState(() => {
    try {
      // First, try to get team-specific progress data
      let raw = localStorage.getItem(storageKey)
      
      // If team-specific data doesn't exist and we have a team name, 
      // DO NOT migrate from old global format to avoid team data contamination
      // Instead, start fresh for each team
      if (!raw && teamName) {
        const oldKey = STORAGE_KEY_PREFIX
        const oldRaw = localStorage.getItem(oldKey)
        if (oldRaw) {
          console.log(`🗑️ Found old global progress data - clearing to prevent team contamination`)
          // Clear old global data to prevent contamination
          localStorage.removeItem(oldKey)
          
          // Also clear any old photo records that might be team-mixed
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith('session-photos:') && !key.includes(':Red') && !key.includes(':Blue')) {
              console.log(`🗑️ Clearing old photo record: ${key}`)
              localStorage.removeItem(key)
            }
          }
        }
        // Start with fresh data for this team
        return {}
      }
      
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })
  
  useEffect(() => {
    try {
      // Persist whenever progress changes. If in private mode or blocked, this might throw.
      localStorage.setItem(storageKey, JSON.stringify(progress))
    } catch (error: any) {
      // Handle quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded - clearing old data and trying again')
        // Try to clear existing data and save again
        localStorage.removeItem(storageKey)
        try {
          localStorage.setItem(storageKey, JSON.stringify(progress))
        } catch {
          console.error('Failed to save progress even after clearing storage')
        }
      }
    }
  }, [progress])
  
  // Derived values for the progress UI
  const completeCount = useMemo(() => stops.reduce((acc, s) => acc + ((progress[s.id]?.done) ? 1 : 0), 0), [progress, stops])
  const percent = stops.length === 0 ? 0 : Math.round((completeCount / stops.length) * 100)
  
  // Team-specific reset function
  const resetProgress = () => {
    try {
      // Clear from localStorage
      localStorage.removeItem(storageKey)
      console.log(`🗑️ Cleared progress for team: ${teamName || 'default'}`)
      
      // Reset state
      setProgress({})
    } catch (error) {
      console.error('Failed to reset progress:', error)
    }
  }
  
  // Complete localStorage cleanup for testing (clears ALL team data)
  const clearAllTeamData = () => {
    try {
      console.log('🧹 Clearing ALL team data from localStorage')
      
      // Clear all progress data (global and team-specific)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('vail-love-hunt-progress') ||
          key.startsWith('session-photos:')
        )) {
          console.log(`🗑️ Removing: ${key}`)
          localStorage.removeItem(key)
        }
      }
      
      // Reset current state
      setProgress({})
      console.log('✅ All team data cleared')
      
    } catch (error) {
      console.error('Failed to clear all team data:', error)
    }
  }

  return { progress, setProgress, completeCount, percent, resetProgress, clearAllTeamData }
}