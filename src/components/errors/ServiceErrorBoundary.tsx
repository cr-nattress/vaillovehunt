/**
 * Service Error Boundary - Phase 6 Frontend Integration
 * 
 * React error boundary specifically designed for service layer errors with:
 * - Service-specific error handling and recovery
 * - Migration fallback strategies
 * - User-friendly error messages
 * - Retry mechanisms
 * - Error reporting integration
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { MigrationPhase, serviceMigrationManager } from '../../services/migration/ServiceMigrationGuide'

interface ServiceErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRecovering: boolean
}

interface ServiceErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  enableFallback?: boolean
  maxRetries?: number
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

/**
 * Error boundary for service layer integration
 */
export class ServiceErrorBoundary extends Component<ServiceErrorBoundaryProps, ServiceErrorBoundaryState> {
  private retryTimeouts: number[] = []

  constructor(props: ServiceErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ServiceErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ServiceErrorBoundary caught error:', error)
    console.error('Error info:', errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Report error to parent callback
    this.props.onError?.(error, errorInfo)

    // Attempt service migration fallback if enabled
    if (this.props.enableFallback) {
      this.attemptMigrationFallback(error)
    }

    // Log error details for debugging
    this.logErrorDetails(error, errorInfo)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  private logErrorDetails = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      migrationPhase: serviceMigrationManager.getMigrationStatus().phase,
      timestamp: new Date().toISOString()
    }

    console.group('🚨 Service Error Details')
    console.error('Error:', errorDetails)
    console.groupEnd()

    // In a real application, you might send this to an error reporting service
    // Example: ErrorReportingService.report(errorDetails)
  }

  private attemptMigrationFallback = async (error: Error) => {
    const currentStatus = serviceMigrationManager.getMigrationStatus()
    
    // If we're not in legacy-only mode, try falling back
    if (currentStatus.phase !== MigrationPhase.LEGACY_ONLY) {
      console.log('🔄 ServiceErrorBoundary: Attempting migration fallback due to error')
      
      // Temporary fallback to legacy mode
      const originalPhase = currentStatus.phase
      serviceMigrationManager.setMigrationPhase(MigrationPhase.LEGACY_ONLY)
      
      // Restore original phase after a delay
      setTimeout(() => {
        console.log('🔄 ServiceErrorBoundary: Restoring original migration phase:', originalPhase)
        serviceMigrationManager.setMigrationPhase(originalPhase)
      }, 30000) // 30 seconds
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('⚠️ ServiceErrorBoundary: Max retries exceeded')
      return
    }

    this.setState({
      isRecovering: true,
      retryCount: this.state.retryCount + 1
    })

    // Progressive delay: 1s, 2s, 4s, etc.
    const delay = Math.pow(2, this.state.retryCount) * 1000
    
    const timeout = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      })
    }, delay)

    this.retryTimeouts.push(timeout)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    })
  }

  private getErrorMessage = (error: Error): string => {
    // Service-specific error messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('403')) {
      return 'You don\'t have permission to access this resource.'
    }
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested data could not be found.'
    }
    
    if (error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.'
    }

    // Default fallback message
    return 'Something went wrong while loading your data. Please try again.'
  }

  private renderErrorUI = () => {
    const { error, retryCount, isRecovering } = this.state
    const { maxRetries = 3 } = this.props
    const canRetry = retryCount < maxRetries

    return (
      <div 
        className="flex flex-col items-center justify-center p-6 bg-white border border-red-200 rounded-lg shadow-sm"
        style={{
          backgroundColor: 'var(--color-white)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: 'var(--color-dark-neutral)'
        }}
      >
        {/* Error Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <svg 
            className="w-6 h-6 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Error Message */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-cabernet)' }}>
          Oops! Something went wrong
        </h3>
        
        <p className="text-sm text-center mb-4 max-w-sm" style={{ color: 'var(--color-medium-grey)' }}>
          {error ? this.getErrorMessage(error) : 'An unexpected error occurred.'}
        </p>

        {/* Retry Information */}
        {retryCount > 0 && (
          <p className="text-xs text-center mb-4" style={{ color: 'var(--color-warm-grey)' }}>
            Retry attempt {retryCount} of {maxRetries}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canRetry && (
            <button
              onClick={this.handleRetry}
              disabled={isRecovering}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-cabernet)',
                color: 'var(--color-white)'
              }}
            >
              {isRecovering ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none"
                      strokeDasharray="31.416"
                      strokeDashoffset="31.416"
                      className="animate-spin"
                    />
                  </svg>
                  Retrying...
                </span>
              ) : (
                'Try Again'
              )}
            </button>
          )}
          
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-medium-grey)',
              borderColor: 'var(--color-light-grey)'
            }}
          >
            Reset
          </button>
        </div>

        {/* Migration Status (Debug Info) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 w-full">
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-warm-grey)' }}>
              Debug Info
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
              <div>Migration Phase: {serviceMigrationManager.getMigrationStatus().phase}</div>
              <div>Error: {error?.message}</div>
              <div>Retry Count: {retryCount}</div>
            </div>
          </details>
        )}
      </div>
    )
  }

  render() {
    const { hasError } = this.state
    const { fallback, children, className } = this.props

    if (hasError) {
      return (
        <div className={className}>
          {fallback || this.renderErrorUI()}
        </div>
      )
    }

    return children
  }
}

/**
 * Hook for programmatically triggering error boundary
 */
export function useErrorBoundary() {
  return (error: Error) => {
    throw error
  }
}

/**
 * Higher-order component wrapper for ServiceErrorBoundary
 */
export function withServiceErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ServiceErrorBoundaryProps, 'children'>
) {
  return function WithServiceErrorBoundary(props: T) {
    return (
      <ServiceErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ServiceErrorBoundary>
    )
  }
}