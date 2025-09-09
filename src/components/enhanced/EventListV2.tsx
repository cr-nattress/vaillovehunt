/**
 * Enhanced Event List Component - Phase 6 Frontend Integration
 * 
 * V2 service-powered event list with:
 * - Service layer integration via hooks
 * - Error boundaries and loading states
 * - Real-time data updates
 * - Caching and performance optimization
 * - Migration compatibility
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useTodaysEvents, useServiceCache } from '../../hooks/useServiceV2'
import { useServices } from '../../contexts/ServiceContext'
import { ServiceErrorBoundary } from '../errors/ServiceErrorBoundary'
import { EventListLoading, LoadingSpinner, ButtonLoading } from '../loading/ServiceLoadingStates'
import type { EventQueryOptions } from '../../services/EventServiceV2'

interface EventListV2Props {
  className?: string
  filterOptions?: Partial<EventQueryOptions>
  onEventClick?: (event: any) => void
  showRefresh?: boolean
  maxEvents?: number
  emptyMessage?: string
}

function EventListV2Inner({
  className = '',
  filterOptions = {},
  onEventClick,
  showRefresh = true,
  maxEvents,
  emptyMessage = 'No events found for today'
}: EventListV2Props) {
  const [refreshing, setRefreshing] = useState(false)
  const { clearEventCache } = useServiceCache()
  const { servicesHealthy } = useServices()

  // Use the V2 services hook for events
  const {
    data: events,
    loading,
    error,
    refetch,
    lastUpdated
  } = useTodaysEvents(filterOptions)

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Clear cache and refetch
      clearEventCache()
      await refetch()
    } catch (error) {
      console.error('Failed to refresh events:', error)
    } finally {
      setRefreshing(false)
    }
  }, [clearEventCache, refetch])

  // Format events for display
  const displayEvents = useMemo(() => {
    if (!events) return []
    
    const sortedEvents = [...events].sort((a, b) => {
      // Sort by start date, then by hunt name
      const dateCompare = (a.startDate || '').localeCompare(b.startDate || '')
      if (dateCompare !== 0) return dateCompare
      return (a.huntName || '').localeCompare(b.huntName || '')
    })

    return maxEvents ? sortedEvents.slice(0, maxEvents) : sortedEvents
  }, [events, maxEvents])

  // Format last updated time
  const formatLastUpdated = useCallback((timestamp: number) => {
    if (!timestamp) return ''
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }, [])

  // Render loading state
  if (loading && !events) {
    return (
      <div className={className}>
        <EventListLoading count={3} />
      </div>
    )
  }

  // Render error state (handled by error boundary, but fallback)
  if (error && !events) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm mb-4" style={{ color: 'var(--color-medium-grey)' }}>
          Unable to load events. Please try again.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            backgroundColor: 'var(--color-cabernet)',
            color: 'var(--color-white)'
          }}
        >
          {refreshing ? <ButtonLoading text="Refreshing..." /> : 'Try Again'}
        </button>
      </div>
    )
  }

  // Render empty state
  if (!displayEvents.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-light-grey)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-medium-grey)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-medium-grey)' }}>
          {emptyMessage}
        </p>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-cabernet)',
              borderColor: 'var(--color-cabernet)'
            }}
          >
            {refreshing ? <ButtonLoading text="Checking..." /> : 'Check Again'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header with refresh controls */}
      {showRefresh && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-dark-neutral)' }}>
              Today's Events
            </h3>
            {!servicesHealthy && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-xs" style={{ color: 'var(--color-medium-grey)' }}>
                  Limited connectivity
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-warm-grey)' }}>
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-medium-grey)'
              }}
              aria-label="Refresh events"
            >
              {refreshing || loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="space-y-3">
        {displayEvents.map((event, index) => (
          <EventCard
            key={`${event.orgSlug}-${event.huntId}-${index}`}
            event={event}
            onClick={onEventClick}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {maxEvents && events && events.length > maxEvents && (
        <div className="text-center mt-4">
          <p className="text-sm" style={{ color: 'var(--color-medium-grey)' }}>
            Showing {maxEvents} of {events.length} events
          </p>
        </div>
      )}
    </div>
  )
}

// Individual event card component
function EventCard({ 
  event, 
  onClick 
}: { 
  event: any
  onClick?: (event: any) => void 
}) {
  const handleClick = useCallback(() => {
    onClick?.(event)
  }, [event, onClick])

  const statusColors = {
    active: 'var(--color-green)',
    upcoming: 'var(--color-cabernet)',
    completed: 'var(--color-warm-grey)',
    cancelled: 'var(--color-medium-grey)'
  }

  const statusColor = statusColors[event.status as keyof typeof statusColors] || statusColors.active

  return (
    <div 
      className={`border rounded-lg p-4 transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}`}
      style={{
        backgroundColor: 'var(--color-white)',
        borderColor: 'var(--color-light-grey)'
      }}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
    >
      {/* Event header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-lg" style={{ color: 'var(--color-dark-neutral)' }}>
            {event.huntName}
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-medium-grey)' }}>
            {event.orgName || event.orgSlug}
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-xs capitalize" style={{ color: statusColor }}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Event details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {event.location && (
          <div>
            <span className="font-medium" style={{ color: 'var(--color-dark-neutral)' }}>Location:</span>
            <p style={{ color: 'var(--color-medium-grey)' }}>
              {typeof event.location === 'string' 
                ? event.location 
                : `${event.location.city}, ${event.location.state}`
              }
            </p>
          </div>
        )}
        
        {(event.startDate || event.endDate) && (
          <div>
            <span className="font-medium" style={{ color: 'var(--color-dark-neutral)' }}>Date:</span>
            <p style={{ color: 'var(--color-medium-grey)' }}>
              {event.startDate === event.endDate 
                ? event.startDate 
                : `${event.startDate} - ${event.endDate}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Participation info */}
      {(event.stops?.length || event.teams?.length) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-light-grey)' }}>
          {event.stops?.length && (
            <span className="text-xs" style={{ color: 'var(--color-warm-grey)' }}>
              {event.stops.length} stops
            </span>
          )}
          {event.teams?.length && (
            <span className="text-xs" style={{ color: 'var(--color-warm-grey)' }}>
              {event.teams.length} teams
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Main component wrapped with error boundary
export default function EventListV2(props: EventListV2Props) {
  return (
    <ServiceErrorBoundary
      enableFallback={true}
      onError={(error) => {
        console.error('EventListV2 error:', error)
      }}
    >
      <EventListV2Inner {...props} />
    </ServiceErrorBoundary>
  )
}