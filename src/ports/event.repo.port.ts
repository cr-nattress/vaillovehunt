/**
 * Event Repository Port
 * 
 * Clean interface for event data access operations.
 * Adapters will implement this interface for different storage backends.
 */

export interface EventSummary {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  startAt?: string
  endAt?: string
  data?: any
}

export interface Event extends EventSummary {
  // Extended event details would go here
  // (stops, rules, etc.)
}

export interface ETagged<T> {
  data: T
  etag?: string
}

export interface ListTodayInput {
  now: Date
  orgId?: string
}

export interface GetEventInput {
  orgId: string
  eventId: string
}

export interface UpsertEventInput {
  orgId: string
  event: Event
  expectedEtag?: string
}

/**
 * Port interface for event repository operations
 */
export interface EventRepoPort {
  /**
   * List events for today, optionally filtered by organization
   */
  listToday(input: ListTodayInput): Promise<EventSummary[]>
  
  /**
   * Get a specific event by organization and event ID
   */
  getEvent(input: GetEventInput): Promise<Event>
  
  /**
   * Create or update an event with optional optimistic concurrency control
   */
  upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>>
}