import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { emailService } from './services/EmailService'

const router = Router()

interface MagicLinkRequest {
  email: string
  returnUrl?: string
}

interface MagicLinkResponse {
  success: boolean
  message: string
  token?: string
}

// In-memory store for magic link tokens (in production, use Redis or database)
const magicLinkTokens = new Map<string, {
  email: string
  expiresAt: number
  returnUrl?: string
}>()

/**
 * Send a magic link to the specified email address
 * POST /api/auth/magic-link
 */
router.post('/magic-link', async (req: Request, res: Response) => {
  try {
    const { email, returnUrl }: MagicLinkRequest = req.body

    console.log('🔗 Magic link request:', { email, returnUrl })

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes

    // Store token
    magicLinkTokens.set(token, {
      email,
      expiresAt,
      returnUrl
    })

    // Generate the magic link URL
    const magicLink = `${req.protocol}://${req.get('host')}/auth/verify?token=${token}`
    
    console.log('✨ Magic link generated:', magicLink)
    
    // Send the magic link email
    const emailResult = await emailService.sendMagicLinkEmail({
      to: email,
      magicLink,
      expiresInMinutes: 15
    })

    if (!emailResult.success) {
      // Clean up the token if email failed
      magicLinkTokens.delete(token)
      console.error('❌ Failed to send email:', emailResult.error)

      const allowDevMode = process.env.EMAIL_DEV_MODE === 'true'
      if (allowDevMode) {
        // In local dev, avoid failing the flow; surface informative success
        const devResponse: MagicLinkResponse = {
          success: true,
          message: process.env.NODE_ENV === 'development' && emailResult.error
            ? `Magic link generated (dev mode). Email not sent: ${emailResult.error}`
            : 'Magic link generated (dev mode). Email not sent.',
          ...(process.env.NODE_ENV === 'development' && { token })
        }
        return res.json(devResponse)
      }

      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' && emailResult.error
          ? `Failed to send magic link email: ${emailResult.error}`
          : 'Failed to send magic link email'
      })
    }

    console.log('✅ Magic link email sent successfully')

    const response: MagicLinkResponse = {
      success: true,
      message: 'Magic link sent successfully',
      // Include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    }

    res.json(response)

  } catch (error) {
    console.error('❌ Magic link error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send magic link'
    })
  }
})

/**
 * Verify magic link token
 * GET /api/auth/verify?token=xxx
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    console.log('🔍 Verifying magic link token:', token)

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing token'
      })
    }

    const tokenData = magicLinkTokens.get(token)
    
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    if (Date.now() > tokenData.expiresAt) {
      // Clean up expired token
      magicLinkTokens.delete(token)
      return res.status(400).json({
        success: false,
        message: 'Token has expired'
      })
    }

    // Token is valid, clean up and return user info
    magicLinkTokens.delete(token)
    
    console.log('✅ Magic link verified for:', tokenData.email)

    // Return user authentication data
    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        email: tokenData.email,
        authenticated: true,
        loginMethod: 'magic-link'
      },
      returnUrl: tokenData.returnUrl
    })

  } catch (error) {
    console.error('❌ Token verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    })
  }
})

/**
 * Get current authentication status
 * GET /api/auth/status
 */
router.get('/status', async (req: Request, res: Response) => {
  // In a real app, you'd check JWT tokens or session cookies
  // For now, return a basic response
  res.json({
    authenticated: false,
    user: null
  })
})

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of magicLinkTokens.entries()) {
    if (now > data.expiresAt) {
      magicLinkTokens.delete(token)
    }
  }
}, 5 * 60 * 1000)

export default router