/**
 * Security utilities for input validation and sanitization
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  // Team name: alphanumeric, spaces, hyphens, apostrophes (2-50 chars)
  teamName: /^[a-zA-Z0-9\s\-']{2,50}$/,
  
  // Event name: alphanumeric, spaces, common punctuation (2-100 chars)
  eventName: /^[a-zA-Z0-9\s\-'.,!?&()]{2,100}$/,
  
  // Location code: specific predefined values only
  locationCode: /^(BHHS|Vail Valley|Vail Village|TEST)$/,
  
  // Stop ID: UUID format
  stopId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Session ID: alphanumeric (8-32 chars)
  sessionId: /^[a-zA-Z0-9]{8,32}$/,
  
  // File names: safe characters only
  fileName: /^[a-zA-Z0-9\-_.]{1,255}$/,
  
  // URL paths: safe URL characters
  urlPath: /^[a-zA-Z0-9\-_.~!*'();:@&=+$,/?#[\]%]+$/
} as const

// Content length limits
export const CONTENT_LIMITS = {
  teamName: 50,
  eventName: 100,
  notes: 500,
  fileName: 255,
  fileSize: 10 * 1024 * 1024, // 10MB
  sessionData: 100 * 1024 // 100KB
} as const

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  mimePattern: /^image\/(jpeg|jpg|png|webp|gif)$/
} as const

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Sanitize text input for safe storage/display
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000) // Limit length
}

/**
 * Validate team name input
 */
export function validateTeamName(teamName: string): { isValid: boolean; error?: string } {
  if (!teamName || typeof teamName !== 'string') {
    return { isValid: false, error: 'Team name is required' }
  }
  
  const sanitized = sanitizeText(teamName)
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Team name must be at least 2 characters' }
  }
  
  if (sanitized.length > CONTENT_LIMITS.teamName) {
    return { isValid: false, error: `Team name must be no more than ${CONTENT_LIMITS.teamName} characters` }
  }
  
  if (!VALIDATION_PATTERNS.teamName.test(sanitized)) {
    return { isValid: false, error: 'Team name contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validate event name input
 */
export function validateEventName(eventName: string): { isValid: boolean; error?: string } {
  if (!eventName || typeof eventName !== 'string') {
    return { isValid: false, error: 'Event name is required' }
  }
  
  const sanitized = sanitizeText(eventName)
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Event name must be at least 2 characters' }
  }
  
  if (sanitized.length > CONTENT_LIMITS.eventName) {
    return { isValid: false, error: `Event name must be no more than ${CONTENT_LIMITS.eventName} characters` }
  }
  
  if (!VALIDATION_PATTERNS.eventName.test(sanitized)) {
    return { isValid: false, error: 'Event name contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validate location code
 */
export function validateLocationCode(locationCode: string): { isValid: boolean; error?: string } {
  if (!locationCode || typeof locationCode !== 'string') {
    return { isValid: false, error: 'Location code is required' }
  }
  
  if (!VALIDATION_PATTERNS.locationCode.test(locationCode)) {
    return { isValid: false, error: 'Invalid location code' }
  }
  
  return { isValid: true }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }
  
  // Check file size
  if (file.size > CONTENT_LIMITS.fileSize) {
    return { isValid: false, error: `File size must be less than ${CONTENT_LIMITS.fileSize / (1024 * 1024)}MB` }
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.mimePattern.test(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only images are allowed.' }
  }
  
  // Check file name
  if (!VALIDATION_PATTERNS.fileName.test(file.name)) {
    return { isValid: false, error: 'Invalid file name' }
  }
  
  return { isValid: true }
}

/**
 * Validate session ID
 */
export function validateSessionId(sessionId: string): { isValid: boolean; error?: string } {
  if (!sessionId || typeof sessionId !== 'string') {
    return { isValid: false, error: 'Session ID is required' }
  }
  
  if (!VALIDATION_PATTERNS.sessionId.test(sessionId)) {
    return { isValid: false, error: 'Invalid session ID format' }
  }
  
  return { isValid: true }
}

/**
 * Sanitize URL parameter
 */
export function sanitizeUrlParam(param: string): string {
  if (typeof param !== 'string') {
    return ''
  }
  
  return encodeURIComponent(param.trim().substring(0, 100))
}

/**
 * Rate limiting utility (simple in-memory implementation)
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  
  isAllowed(key: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Generate secure random string
 */
export function generateSecureId(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)
    
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length]
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return result
}

/**
 * Check if content contains potential security threats
 */
export function containsSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /localStorage/i,
    /sessionStorage/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(content))
}

/**
 * Security audit logger
 */
export function logSecurityEvent(event: string, details: any = {}): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    details: {
      userAgent: navigator?.userAgent || 'unknown',
      url: window?.location?.href || 'unknown',
      ...details
    }
  }
  
  // In production, send to security monitoring service
  console.warn('Security Event:', logEntry)
  
  // Store critical security events locally for analysis
  try {
    const securityLogs = JSON.parse(localStorage.getItem('security_logs') || '[]')
    securityLogs.push(logEntry)
    
    // Keep only last 100 entries
    if (securityLogs.length > 100) {
      securityLogs.shift()
    }
    
    localStorage.setItem('security_logs', JSON.stringify(securityLogs))
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}