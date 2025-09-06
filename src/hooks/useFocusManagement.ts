import { useRef, useEffect } from 'react'

/**
 * Custom hook for managing focus in modals and panels
 * Provides focus trapping and restoration functionality
 */
export function useFocusManagement(isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const trapRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element before opening
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Focus the first focusable element in the trap
      const focusFirst = () => {
        if (trapRef.current) {
          const focusableElements = getFocusableElements(trapRef.current)
          if (focusableElements.length > 0) {
            focusableElements[0].focus()
          }
        }
      }

      // Delay to ensure DOM is ready
      setTimeout(focusFirst, 100)

      // Set up focus trap
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && trapRef.current) {
          trapFocus(e, trapRef.current)
        }
        
        // Close on Escape key
        if (e.key === 'Escape') {
          handleClose()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      // Restore focus when closed
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [isOpen])

  const handleClose = () => {
    // This should be handled by the parent component
    // but we provide a way to signal escape was pressed
    const escapeEvent = new CustomEvent('focusManagementEscape')
    document.dispatchEvent(escapeEvent)
  }

  return { trapRef }
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
}

/**
 * Trap focus within a container
 */
function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusableElements = getFocusableElements(container)
  
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    // Shift + Tab - move to previous element
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab - move to next element
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

/**
 * Custom hook for managing focus announcements
 */
export function useFocusAnnouncement() {
  const announceToScreenReader = (message: string) => {
    const announcement = document.getElementById('status-announcements')
    if (announcement) {
      announcement.textContent = message
      // Clear after announcement
      setTimeout(() => {
        announcement.textContent = ''
      }, 1000)
    }
  }

  return { announceToScreenReader }
}