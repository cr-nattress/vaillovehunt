/**
 * Push Notification Service
 * Handles browser push notifications and service worker communication
 */

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

export class NotificationService {
  private static instance: NotificationService
  private swRegistration: ServiceWorkerRegistration | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    if (!('PushManager' in window)) {
      console.warn('Push messaging not supported')
      return
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready
      console.log('Notification service initialized')
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
    }
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  /**
   * Show a local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    if (this.swRegistration) {
      // Use service worker notification (better for PWA)
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/badge.png',
        vibrate: [100, 50, 100],
        data: payload.data,
        requireInteraction: false,
        silent: false
      })
    } else {
      // Fallback to browser notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        data: payload.data
      })
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.warn('Service Worker not registered')
      return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    try {
      // Note: In production, you'd use your own VAPID keys
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          // This is a demo VAPID key - replace with your own in production
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80YNhQZDOPBHx99ZyRcDQjFJMejwObx2zPeW5W3J3-6LXR3B-WsGXVCw'
        )
      })

      console.log('Push subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        console.log('Unsubscribed from push notifications')
        return true
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
    }

    return false
  }

  /**
   * Send a message to the service worker
   */
  sendMessageToSW(message: any): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }

  /**
   * Queue actions for background sync
   */
  queueForBackgroundSync(type: string, payload: any): void {
    this.sendMessageToSW({
      type: `QUEUE_${type.toUpperCase()}`,
      payload
    })
  }

  /**
   * Utility function to convert VAPID key
   */
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Predefined notification methods for common app events
   */
  async notifyStopCompleted(stopTitle: string): Promise<void> {
    await this.showNotification({
      title: 'Stop Completed! 🎉',
      body: `You completed "${stopTitle}". Great job!`,
      data: { type: 'stop-completed', stopTitle }
    })
  }

  async notifyHuntCompleted(): Promise<void> {
    await this.showNotification({
      title: 'Scavenger Hunt Complete! 🏆',
      body: 'Congratulations! You completed the entire scavenger hunt!',
      data: { type: 'hunt-completed' }
    })
  }

  async notifyConnectionRestored(): Promise<void> {
    await this.showNotification({
      title: 'Connection Restored 📶',
      body: 'Your data has been synced successfully.',
      data: { type: 'connection-restored' }
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()