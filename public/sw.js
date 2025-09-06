// Service Worker for Vail Love Hunt
// Implements caching strategies for better performance

const CACHE_NAME = 'vail-love-hunt-v1'
const STATIC_CACHE_NAME = 'vail-love-hunt-static-v1'
const DYNAMIC_CACHE_NAME = 'vail-love-hunt-dynamic-v1'

// Assets to cache immediately (critical resources)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/images/selfie-placeholder.svg'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets (JS, CSS, images)
  CACHE_FIRST: 'cache-first',
  // Network first for API calls and dynamic content
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for frequently updated content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        // Claim all clients immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip cross-origin requests that don't support CORS
  if (url.origin !== self.location.origin && !url.origin.includes('cloudinary')) {
    return
  }

  event.respondWith(
    handleRequest(request)
  )
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  try {
    // Static assets (JS, CSS, images) - Cache First
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request, STATIC_CACHE_NAME)
    }
    
    // API calls - Network First with fallback
    if (isApiCall(pathname)) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME)
    }
    
    // Images from external sources (Cloudinary) - Stale While Revalidate
    if (isExternalImage(url)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME)
    }
    
    // Default: Network First
    return await networkFirst(request, DYNAMIC_CACHE_NAME)
    
  } catch (error) {
    console.error('Service Worker: Fetch error', error)
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE_NAME)
      return await cache.match('/index.html')
    }
    
    // Return generic error response
    return new Response('Network error occurred', {
      status: 408,
      statusText: 'Network error'
    })
  }
}

// Cache First strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If not in cache, fetch and cache
  const networkResponse = await fetch(request)
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network First strategy - for API calls
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale While Revalidate strategy - for images
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone())
        }
      })
      .catch(() => {
        // Ignore network errors in background update
      })
    
    return cachedResponse
  }
  
  // If not cached, fetch and cache
  const networkResponse = await fetch(request)
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Helper functions to determine request type
function isStaticAsset(pathname) {
  return pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.webp') ||
         pathname.includes('/assets/') ||
         pathname.includes('/chunks/') ||
         pathname.includes('/entries/')
}

function isApiCall(pathname) {
  return pathname.startsWith('/api/') ||
         pathname.startsWith('/.netlify/functions/')
}

function isExternalImage(url) {
  return url.hostname.includes('cloudinary.com') ||
         url.hostname.includes('res.cloudinary.com')
}

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered for', event.tag)
    
    if (event.tag === 'photo-upload') {
      event.waitUntil(syncPhotoUploads())
    } else if (event.tag === 'settings-sync') {
      event.waitUntil(syncSettings())
    } else if (event.tag === 'progress-sync') {
      event.waitUntil(syncProgress())
    }
  })
}

// Enhanced offline functionality
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'QUEUE_PHOTO_UPLOAD') {
    queuePhotoUpload(event.data.payload)
  } else if (event.data && event.data.type === 'QUEUE_SETTINGS_UPDATE') {
    queueSettingsUpdate(event.data.payload)
  }
})

// Offline queue management
let offlineQueue = []

async function syncPhotoUploads() {
  console.log('Service Worker: Syncing queued photo uploads')
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const queuedUploads = await getQueuedUploads()
  
  for (const upload of queuedUploads) {
    try {
      const response = await fetch(upload.url, {
        method: 'POST',
        body: upload.data
      })
      
      if (response.ok) {
        await removeFromQueue('photo-upload', upload.id)
        console.log('Service Worker: Successfully synced photo upload', upload.id)
      }
    } catch (error) {
      console.error('Service Worker: Failed to sync photo upload', error)
    }
  }
}

async function syncSettings() {
  console.log('Service Worker: Syncing settings updates')
  const queuedSettings = await getQueuedSettings()
  
  for (const setting of queuedSettings) {
    try {
      const response = await fetch('/api/kv-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting.data)
      })
      
      if (response.ok) {
        await removeFromQueue('settings-sync', setting.id)
        console.log('Service Worker: Successfully synced settings', setting.id)
      }
    } catch (error) {
      console.error('Service Worker: Failed to sync settings', error)
    }
  }
}

async function syncProgress() {
  console.log('Service Worker: Syncing progress updates')
  // Similar implementation for progress sync
}

async function queuePhotoUpload(payload) {
  const id = Date.now().toString()
  const queueItem = {
    id,
    type: 'photo-upload',
    payload,
    timestamp: Date.now()
  }
  
  // Store in IndexedDB or cache storage
  offlineQueue.push(queueItem)
  console.log('Service Worker: Queued photo upload for sync', id)
}

async function queueSettingsUpdate(payload) {
  const id = Date.now().toString()
  const queueItem = {
    id,
    type: 'settings-sync',
    payload,
    timestamp: Date.now()
  }
  
  offlineQueue.push(queueItem)
  console.log('Service Worker: Queued settings update for sync', id)
}

async function getQueuedUploads() {
  return offlineQueue.filter(item => item.type === 'photo-upload')
}

async function getQueuedSettings() {
  return offlineQueue.filter(item => item.type === 'settings-sync')
}

async function removeFromQueue(type, id) {
  offlineQueue = offlineQueue.filter(item => !(item.type === type && item.id === id))
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event)
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Hunt',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Vail Scavenger Hunt', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  }
})