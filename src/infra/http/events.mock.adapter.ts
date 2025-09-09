/**
 * Mock Event Repository Adapter
 * 
 * Wraps existing EventService mock logic to implement the EventRepoPort interface.
 * This adapter provides the default behavior when feature flags are disabled.
 */

import type { 
  EventRepoPort, 
  EventSummary, 
  Event, 
  ListTodayInput, 
  GetEventInput, 
  UpsertEventInput, 
  ETagged 
} from '../../ports/event.repo.port'

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export class MockEventAdapter implements EventRepoPort {
  async listToday(input: ListTodayInput): Promise<EventSummary[]> {
    const todayStr = formatDateYYYYMMDD(input.now)
    
    console.log('📋 MockEventAdapter: Generating mock events for today')
    
    // Return mock scavenger hunts occurring today
    const mockEvents: EventSummary[] = [
      {
        key: 'events/bhhs-vail',
        orgSlug: 'bhhs',
        orgName: 'BHHS',
        eventName: 'Vail',
        startAt: todayStr,
        endAt: todayStr,
        data: { description: 'BHHS Vail Scavenger Hunt' }
      },
      {
        key: 'events/beaver-creek-sports-nottingham',
        orgSlug: 'beaver-creek-sports',
        orgName: 'Beaver Creek Sports',
        eventName: 'Nottingham Hunt',
        startAt: todayStr,
        endAt: todayStr,
        data: { description: 'Beaver Creek Sports Nottingham Hunt' }
      },
      {
        key: 'events/ra-nelson-find-the-goat',
        orgSlug: 'ra-nelson',
        orgName: 'RA Nelson',
        eventName: 'Find the goat',
        startAt: todayStr,
        endAt: todayStr,
        data: { description: 'RA Nelson Find the goat Hunt' }
      }
    ]

    // Filter by organization if specified
    const filteredEvents = input.orgId 
      ? mockEvents.filter(event => event.orgSlug === input.orgId)
      : mockEvents

    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return filteredEvents.sort((a, b) => a.orgName.localeCompare(b.orgName))
  }

  async getEvent(input: GetEventInput): Promise<Event> {
    // For mock, generate a fake detailed event
    const mockEvent: Event = {
      key: `events/${input.orgId}-${input.eventId}`,
      orgSlug: input.orgId,
      orgName: input.orgId.replace('-', ' ').toUpperCase(),
      eventName: input.eventId,
      startAt: formatDateYYYYMMDD(new Date()),
      endAt: formatDateYYYYMMDD(new Date()),
      data: {
        description: `Mock event: ${input.eventId} for ${input.orgId}`,
        huntId: input.eventId,
        status: 'active'
      }
    }

    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 50))
    
    return mockEvent
  }

  async upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>> {
    // Mock implementation - just return the event with a fake etag
    const result: ETagged<Event> = {
      data: input.event,
      etag: `mock-etag-${Date.now()}`
    }

    console.log(`📝 MockEventAdapter: Mock upsert for ${input.event.orgSlug}/${input.event.key}`)
    
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return result
  }
}