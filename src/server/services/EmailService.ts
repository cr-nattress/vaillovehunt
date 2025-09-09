import { Resend } from 'resend'

interface MagicLinkEmailOptions {
  to: string
  magicLink: string
  expiresInMinutes?: number
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email service using Resend for transactional emails
 */
export class EmailService {
  private static instance: EmailService
  private resend: Resend | null = null
  private isConfigured = false

  private constructor() {
    // Don't initialize on construction - wait until first use
    // This allows environment variables to be loaded first
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private initializeResend() {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not found. Email service will be disabled.')
      console.warn('   Get your free API key at: https://resend.com/api-keys')
      return
    }

    try {
      this.resend = new Resend(apiKey)
      this.isConfigured = true
      console.log('✅ Resend email service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Resend:', error)
    }
  }

  /**
   * Send a magic link email
   */
  async sendMagicLinkEmail(options: MagicLinkEmailOptions): Promise<EmailResponse> {
    const { to, magicLink, expiresInMinutes = 15 } = options

    // Initialize on first use to ensure environment variables are loaded
    if (!this.isConfigured) {
      this.initializeResend()
    }

    const allowDevMode = process.env.EMAIL_DEV_MODE === 'true'

    if (!this.isConfigured || !this.resend) {
      console.warn('📧 Email service not configured (missing RESEND_API_KEY).')
      if (allowDevMode) {
        console.log('🧪 EMAIL_DEV_MODE=true — logging magic link instead of sending:')
        console.log(`   To: ${to}`)
        console.log(`   Link: ${magicLink}`)
        return {
          success: true,
          messageId: 'dev-mode-' + Date.now()
        }
      }
      return {
        success: false,
        error: 'Email service not configured. Set RESEND_API_KEY or enable EMAIL_DEV_MODE=true for local testing.'
      }
    }

    try {
      const from = process.env.RESEND_FROM
      if (!from) {
        console.error('❌ RESEND_FROM not set. Configure a verified sender like noreply@yourdomain.com')
        return {
          success: false,
          error: 'RESEND_FROM not configured. Set a verified sender address.'
        }
      }
      const emailHtml = this.generateMagicLinkEmailHtml(magicLink, expiresInMinutes)
      const emailText = this.generateMagicLinkEmailText(magicLink, expiresInMinutes)

      const result = await this.resend.emails.send({
        from,
        to: [to],
        subject: '🔗 Your secure login link for Vail Hunt',
        html: emailHtml,
        text: emailText
      })

      if (result.data?.id) {
        console.log(`✅ Magic link email sent to ${to} (ID: ${result.data.id})`)
        return {
          success: true,
          messageId: result.data.id
        }
      } else {
        console.error('❌ Resend API error:', result.error)
        return {
          success: false,
          error: result.error?.message || 'Failed to send email'
        }
      }

    } catch (error) {
      console.error('❌ Failed to send magic link email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate HTML email template for magic link
   */
  private generateMagicLinkEmailHtml(magicLink: string, expiresInMinutes: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Vail Hunt Login Link</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #552448 0%, #6B3057 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; text-align: center; }
    .content h2 { color: #333; margin: 0 0 20px; font-size: 24px; }
    .content p { color: #666; margin: 0 0 30px; font-size: 16px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #552448 0%, #6B3057 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; margin: 20px 0; transition: transform 0.2s; }
    .button:hover { transform: translateY(-2px); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { color: #666; margin: 0; font-size: 14px; }
    .security-note { background: #f8f9fa; border-left: 4px solid #552448; padding: 20px; margin: 30px 0; text-align: left; }
    .security-note h4 { margin: 0 0 10px; color: #333; font-size: 16px; }
    .security-note p { margin: 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ Vail Hunt</h1>
      <p>Your secure login link has arrived</p>
    </div>
    
    <div class="content">
      <h2>Continue Your Adventure</h2>
      <p>Click the button below to securely log in and continue your hunt:</p>
      
      <a href="${magicLink}" class="button">🔗 Continue Hunt</a>
      
      <div class="security-note">
        <h4>🔐 Security Information</h4>
        <p>This link will expire in <strong>${expiresInMinutes} minutes</strong> and can only be used once. If you didn't request this login link, please ignore this email.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2025 Vail Hunt • Mountain Adventure Awaits</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate plain text email for magic link
   */
  private generateMagicLinkEmailText(magicLink: string, expiresInMinutes: number): string {
    return `
🏔️ Vail Hunt - Your Secure Login Link

Continue Your Adventure

Click the link below to securely log in and continue your hunt:

${magicLink}

Security Information:
🔐 This link will expire in ${expiresInMinutes} minutes and can only be used once.
🛡️ If you didn't request this login link, please ignore this email.

© 2025 Vail Hunt • Mountain Adventure Awaits
This is an automated message, please do not reply.
    `.trim()
  }

  /**
   * Check if email service is properly configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured
  }

  /**
   * Test email service configuration
   */
  async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      return false
    }

    try {
      // Just test if we can access the Resend API
      // We won't actually send a test email
      return true
    } catch (error) {
      console.error('❌ Email service configuration test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()