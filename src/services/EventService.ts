import { config } from '../config'
import { orgRegistryService } from './OrgRegistryService'
import { getEventAdapter } from '../infra/events.adapter.factory'

export interface OrgEvent {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  startAt?: string
  endAt?: string
  data?: any
}

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchFromBlobs(dateStr: string): Promise<OrgEvent[]> {
  try {
    console.log(`🔍 EventService: Fetching events from blobs for ${dateStr}`)
    
    // Load App JSON to get date index
    const appResult = await orgRegistryService.loadApp()
    const app = appResult.data
    
    if (!app.byDate || !app.byDate[dateStr]) {
      console.log(`📭 EventService: No events found for ${dateStr}`)
      return []
    }
    
    const huntEntries = app.byDate[dateStr]
    const events: OrgEvent[] = []
    
    // Load each organization to get hunt details
    for (const entry of huntEntries) {
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
        console.warn(`⚠️ EventService: Failed to load org ${entry.orgSlug}:`, orgError)
      }
    }
    
    console.log(`✅ EventService: Found ${events.length} blob-backed events for ${dateStr}`)
    return events.sort((a, b) => a.orgName.localeCompare(b.orgName))
  } catch (error) {
    console.warn(`⚠️ EventService: Failed to fetch from blobs, falling back to mocks:`, error)
    return []
  }
}

async function fetchFromAPI(baseUrl: string, dateStr?: string): Promise<OrgEvent[]> {
  try {
    const apiUrl = baseUrl ? `${baseUrl}/api/events` : '/api/events'
    const url = dateStr ? `${apiUrl}?date=${dateStr}` : apiUrl
    
    console.log(`🌐 EventService: Fetching from API: ${url}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log(`✅ EventService: API returned ${result.count || 0} events`)
    
    // Convert API response to OrgEvent format
    const events: OrgEvent[] = (result.events || []).map((event: any) => ({
      key: event.key,
      orgSlug: event.orgSlug,
      orgName: event.orgName,
      eventName: event.eventName,
      startAt: event.startDate,
      endAt: event.endDate,
      data: {
        description: `${event.eventName} - ${event.orgName}`,
        huntId: event.huntId,
        status: event.status
      }
    }))
    
    return events
  } catch (error) {
    console.warn('⚠️ EventService: Failed to fetch from API:', error)
    throw error
  }
}

export async function fetchTodaysEvents(baseUrl: string = ''): Promise<OrgEvent[]> {
  const todayStr = formatDateYYYYMMDD(new Date())
  
  console.log('🎯 EventService: Fetching today\'s events from live data sources only')
  
  try {
    // First try the API endpoint
    const apiEvents = await fetchFromAPI(baseUrl, todayStr)
    if (apiEvents.length > 0) {
      console.log('✅ EventService: Using API events')
      return apiEvents
    }
  } catch (apiError) {
    console.log('⚠️ EventService: API failed, trying blob storage')
  }
  
  // Fallback to direct blob access
  const blobEvents = await fetchFromBlobs(todayStr)
  if (blobEvents.length > 0) {
    console.log('✅ EventService: Using blob events')
    return blobEvents
  } else {
    console.log('📭 EventService: No events found in live data sources')
    return []
  }
}

