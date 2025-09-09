/**
 * Blob-backed Event Repository Adapter
 * 
 * Implements EventRepoPort using App/Org JSON stored in Netlify Blobs.
 * This adapter provides read-only access to events stored in the blob registry.
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
import { orgRegistryService } from '../../services/OrgRegistryService'

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export class BlobEventAdapter implements EventRepoPort {
  async listToday(input: ListTodayInput): Promise<EventSummary[]> {
    const todayStr = formatDateYYYYMMDD(input.now)
    
    try {
      console.log(`🔍 BlobEventAdapter: Fetching events from blobs for ${todayStr}`)
      
      // Load App JSON to get date index
      const appResult = await orgRegistryService.loadApp()
      const app = appResult.data
      
      if (!app.byDate || !app.byDate[todayStr]) {
        console.log(`📭 BlobEventAdapter: No events found for ${todayStr}`)
        return []
      }
      
      const huntEntries = app.byDate[todayStr]
      const events: EventSummary[] = []
      
      // Load each organization to get hunt details
      for (const entry of huntEntries) {
        // Skip if filtering by org and this doesn't match
        if (input.orgId && entry.orgSlug !== input.orgId) {
          continue
        }
        
        try {
          const orgResult = await orgRegistryService.loadOrg(entry.orgSlug)
          const org = orgResult.data
          
          // Find the specific hunt
          const hunt = org.hunts.find(h => h.id === entry.huntId)
          if (hunt) {
            events.push({
              key: `events/${hunt.startDate}/${entry.orgSlug}`,
              orgSlug: entry.orgSlug,
              orgName: org.org.orgName,
              eventName: hunt.name,
              startAt: hunt.startDate,
              endAt: hunt.endDate,
              data: {
                description: `${hunt.name} - ${org.org.orgName}`,
                huntId: hunt.id,
                status: hunt.status,
                createdBy: hunt.audit?.createdBy,
                createdAt: hunt.audit?.createdAt
              }
            })
          }
        } catch (orgError) {
          console.warn(`⚠️ BlobEventAdapter: Failed to load org ${entry.orgSlug}:`, orgError)
        }
      }
      
      console.log(`✅ BlobEventAdapter: Found ${events.length} blob-backed events for ${todayStr}`)
      return events.sort((a, b) => a.orgName.localeCompare(b.orgName))
    } catch (error) {
      console.warn(`⚠️ BlobEventAdapter: Failed to fetch from blobs:`, error)
      throw error
    }
  }

  async getEvent(input: GetEventInput): Promise<Event> {
    try {
      console.log(`🔍 BlobEventAdapter: Getting event ${input.eventId} for org ${input.orgId}`)
      
      // Load the organization data
      const orgResult = await orgRegistryService.loadOrg(input.orgId)
      const org = orgResult.data
      
      // Find the specific hunt
      const hunt = org.hunts.find(h => h.id === input.eventId)
      if (!hunt) {
        throw new Error(`Event ${input.eventId} not found in organization ${input.orgId}`)
      }
      
      const event: Event = {
        key: `events/${hunt.startDate}/${input.orgId}`,
        orgSlug: input.orgId,
        orgName: org.org.orgName,
        eventName: hunt.name,
        startAt: hunt.startDate,
        endAt: hunt.endDate,
        data: {
          description: `${hunt.name} - ${org.org.orgName}`,
          huntId: hunt.id,
          status: hunt.status,
          stops: hunt.stops || [],
          rules: hunt.rules,
          teams: hunt.teams,
          scoring: hunt.scoring,
          access: hunt.access,
          createdBy: hunt.audit?.createdBy,
          createdAt: hunt.audit?.createdAt
        }
      }
      
      console.log(`✅ BlobEventAdapter: Found event ${event.eventName}`)
      return event
    } catch (error) {
      console.warn(`⚠️ BlobEventAdapter: Failed to get event:`, error)
      throw error
    }
  }

  async upsertEvent(input: UpsertEventInput): Promise<ETagged<Event>> {
    // Blob adapter is read-only for now
    // TODO: Phase 8 will implement write operations with ETag concurrency control
    throw new Error('BlobEventAdapter: Write operations not yet implemented. Use mock adapter for testing.')
  }
}