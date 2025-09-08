/**
 * HTTP Event Repository Adapter
 * 
 * Implements EventRepoPort using HTTP API calls.
 * This is a stub implementation for Phase 1 - not yet wired into the application.
 */

import { 
  EventRepoPort, 
  EventSummary, 
  Event, 
  ETagged,
  ListTodayInput,
  GetEventInput,
  UpsertEventInput
} from '../../ports/event.repo.port'

export class HttpEventRepoAdapter implements EventRepoPort {
  
  constructor(private baseUrl: string = '') {
    // TODO: Configure base URL from environment/config
  }
  
  async listToday(input: ListTodayInput): Promise<EventSummary[]> {
    // TODO: Implement HTTP call to /api/events?date=YYYY-MM-DD&orgId=...
    throw new Error('HttpEventRepoAdapter.listToday not implemented yet')
  }
  
  async getEvent(input: GetEventInput): Promise<Event> {
    // TODO: Implement HTTP call to /api/events/{orgId}/{eventId}
    throw new Error('HttpEventRepoAdapter.getEvent not implemented yet')
  }
  
  async upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>> {
    // TODO: Implement HTTP POST/PUT to /api/events/{orgId}/{eventId}
    // with If-Match header for optimistic concurrency
    throw new Error('HttpEventRepoAdapter.upsertEvent not implemented yet')
  }
}