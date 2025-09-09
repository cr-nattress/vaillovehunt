import { apiClient } from './apiClient'

export interface MagicLinkRequest {
  email: string
  returnUrl?: string
}

export interface MagicLinkResponse {
  success: boolean
  message: string
  token?: string // Only in development
}

export interface AuthUser {
  email: string
  authenticated: boolean
  loginMethod: string
}

export interface VerifyResponse {
  success: boolean
  message: string
  user?: AuthUser
  returnUrl?: string
}

export interface AuthStatus {
  authenticated: boolean
  user: AuthUser | null
}

/**
 * Authentication service for magic link functionality
 */
export class AuthService {
  private static instance: AuthService

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Send a magic link to the specified email address
   */
  async sendMagicLink(request: MagicLinkRequest): Promise<MagicLinkResponse> {
    console.log('🔗 Sending magic link request:', request)
    
    try {
      const response = await apiClient.post<MagicLinkResponse>('/auth/magic-link', request)
      console.log('✅ Magic link sent successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Failed to send magic link:', error)
      throw error
    }
  }

  /**
   * Verify a magic link token
   */
  async verifyMagicLink(token: string): Promise<VerifyResponse> {
    console.log('🔍 Verifying magic link token:', token)
    
    try {
      const response = await apiClient.get<VerifyResponse>(`/auth/verify?token=${token}`)
      console.log('✅ Token verified successfully:', response)
      return response
    } catch (error) {
      console.error('❌ Failed to verify token:', error)
      throw error
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await apiClient.get<AuthStatus>('/auth/status')
      return response
    } catch (error) {
      console.error('❌ Failed to get auth status:', error)
      return {
        authenticated: false,
        user: null
      }
    }
  }

  /**
   * Extract token from URL query parameters
   */
  extractTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null
    
    const params = new URLSearchParams(window.location.search)
    return params.get('token')
  }

  /**
   * Generate return URL for magic link authentication
   */
  generateReturnUrl(path?: string): string {
    if (typeof window === 'undefined') return ''
    
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    return path ? `${baseUrl}${path}` : `${baseUrl}/auth/callback`
  }

  /**
   * Clear URL parameters after authentication
   */
  clearAuthParams(): void {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    url.searchParams.delete('token')
    window.history.replaceState({}, '', url.toString())
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()