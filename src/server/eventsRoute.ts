import { Request, Response, Router } from 'express'
import { orgRegistryService } from '../services/OrgRegistryService'

export interface EventListItem {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  huntId: string
  startDate: string
  endDate?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
}

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const eventsListHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string || formatDateYYYYMMDD(new Date())
    
    console.log(`🗓️ EventsRoute: Fetching org/hunt list for date: ${date}`)
    
    // Load App JSON to get the date index
    const appResult = await orgRegistryService.loadApp()
    if (!appResult.success) {
      console.log('📭 EventsRoute: No App JSON found, returning empty list')
      res.json({ events: [] })
      return
    }
    
    const app = appResult.data
    
    // Check if there are any hunts for the specified date
    if (!app.byDate || !app.byDate[date]) {
      console.log(`📭 EventsRoute: No events found for ${date}`)
      res.json({ events: [] })
      return
    }
    
    const huntEntries = app.byDate[date]
    const events: EventListItem[] = []
    
    console.log(`🔍 EventsRoute: Found ${huntEntries.length} hunt entries for ${date}`)
    
    // Load each organization to get hunt details
    for (const entry of huntEntries) {
      try {
        console.log(`📂 EventsRoute: Loading organization: ${entry.orgSlug}`)
        
        const orgResult = await orgRegistryService.loadOrg(entry.orgSlug)
        if (!orgResult.success) {
          console.warn(`⚠️ EventsRoute: Failed to load org ${entry.orgSlug}:`, orgResult.error)
          continue
        }
        
        const org = orgResult.data
        
        // Find the specific hunt
        const hunt = org.hunts.find(h => h.id === entry.huntId)
        if (hunt) {
          const eventItem: EventListItem = {
            key: `events/${hunt.startDate}/${entry.orgSlug}/${entry.huntId}`,
            orgSlug: entry.orgSlug,
            orgName: org.org.orgName,
            eventName: hunt.name,
            huntId: hunt.id,
            startDate: hunt.startDate,
            endDate: hunt.endDate,
            status: hunt.status
          }
          
          events.push(eventItem)
          
          console.log(`✅ EventsRoute: Added event: ${org.org.orgName} - ${hunt.name}`)
        } else {
          console.warn(`⚠️ EventsRoute: Hunt ${entry.huntId} not found in org ${entry.orgSlug}`)
        }
      } catch (orgError) {
        console.warn(`⚠️ EventsRoute: Error processing org ${entry.orgSlug}:`, orgError)
      }
    }
    
    // Sort by organization name, then by event name
    events.sort((a, b) => {
      const orgCompare = a.orgName.localeCompare(b.orgName)
      return orgCompare !== 0 ? orgCompare : a.eventName.localeCompare(b.eventName)
    })
    
    console.log(`📋 EventsRoute: Returning ${events.length} events for ${date}`)
    console.log('📊 EventsRoute: Events list:', events.map(e => `${e.orgName} - ${e.eventName}`))
    
    res.json({ 
      date,
      events,
      count: events.length 
    })
    
  } catch (error) {
    console.error('❌ EventsRoute: Error in eventsListHandler:', error)
    res.status(500).json({ 
      error: 'Failed to fetch events list',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const eventsAllHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`🗂️ EventsRoute: Fetching all org/hunt pairs`)
    
    // Load App JSON to get all organizations
    const appResult = await orgRegistryService.loadApp()
    if (!appResult.success) {
      console.log('📭 EventsRoute: No App JSON found, returning empty list')
      res.json({ events: [] })
      return
    }
    
    const app = appResult.data
    const events: EventListItem[] = []
    
    // Load each organization and get all their hunts
    for (const orgSummary of app.organizations) {
      try {
        console.log(`📂 EventsRoute: Loading all hunts for organization: ${orgSummary.orgSlug}`)
        
        const orgResult = await orgRegistryService.loadOrg(orgSummary.orgSlug)
        if (!orgResult.success) {
          console.warn(`⚠️ EventsRoute: Failed to load org ${orgSummary.orgSlug}:`, orgResult.error)
          continue
        }
        
        const org = orgResult.data
        
        // Add all hunts from this organization
        for (const hunt of org.hunts) {
          const eventItem: EventListItem = {
            key: `events/${hunt.startDate}/${orgSummary.orgSlug}/${hunt.id}`,
            orgSlug: orgSummary.orgSlug,
            orgName: org.org.orgName,
            eventName: hunt.name,
            huntId: hunt.id,
            startDate: hunt.startDate,
            endDate: hunt.endDate,
            status: hunt.status
          }
          
          events.push(eventItem)
          
          console.log(`✅ EventsRoute: Added event: ${org.org.orgName} - ${hunt.name} (${hunt.status})`)
        }
        
      } catch (orgError) {
        console.warn(`⚠️ EventsRoute: Error processing org ${orgSummary.orgSlug}:`, orgError)
      }
    }
    
    // Sort by organization name, then by event name
    events.sort((a, b) => {
      const orgCompare = a.orgName.localeCompare(b.orgName)
      return orgCompare !== 0 ? orgCompare : a.eventName.localeCompare(b.eventName)
    })
    
    console.log(`📋 EventsRoute: Returning ${events.length} total events across all orgs`)
    
    res.json({ 
      events,
      count: events.length,
      organizationCount: app.organizations.length
    })
    
  } catch (error) {
    console.error('❌ EventsRoute: Error in eventsAllHandler:', error)
    res.status(500).json({ 
      error: 'Failed to fetch all events',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Create router
const router = Router()

// Route definitions
router.get('/events', eventsListHandler)
router.get('/events/all', eventsAllHandler)

export default router