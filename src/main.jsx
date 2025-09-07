/**
 * Application entry point
 * - Mounts the React app into the DOM element with id="root" defined in `index.html`.
 * - Keeps the boot logic minimal; all app logic resides in `src/App.jsx`.
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import ToastProvider from './features/notifications/ToastProvider.tsx'
import './i18n/config.ts' // Initialize i18n

// Register service worker for production caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                console.log('New content available, please refresh the page')
              }
            })
          }
        })
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
  })
}

// Grab the root container from `index.html`. If this returns null, verify the element id.
const container = document.getElementById('root')

// Initialize a concurrent-mode root (React 18+) and render the top-level <App/> component.
createRoot(container).render(
  <ErrorBoundary>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ErrorBoundary>
)
