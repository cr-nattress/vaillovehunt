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
  uploads: {
    total: number
    photos: number
    videos: number
    lastUploadedAt?: string
    teamCount: number
  }
}

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extract upload summary from hunt data
 * Handles both single-team and multi-team models
 */
function extractUploadSummary(hunt: any): EventListItem['uploads'] {
  // Initialize summary
  let totalPhotos = 0
  let totalVideos = 0
  let lastUploadedAt: string | undefined
  let teamCount = 0
  
  // Handle multi-team model (hunt.teams array)
  if (hunt.teams && Array.isArray(hunt.teams)) {
    teamCount = hunt.teams.length
    
    for (const team of hunt.teams) {
      if (team.uploads) {
        totalPhotos += team.uploads.photos || 0
        totalVideos += team.uploads.videos || 0
        
        // Track latest upload across all teams
        if (team.uploads.lastUploadedAt) {
          if (!lastUploadedAt || team.uploads.lastUploadedAt > lastUploadedAt) {
            lastUploadedAt = team.uploads.lastUploadedAt
          }
        }
      }
    }
  }
  // Handle single-team model (hunt.uploads at hunt level)
  else if (hunt.uploads?.summary) {
    totalPhotos = hunt.uploads.summary.photos || 0
    totalVideos = hunt.uploads.summary.videos || 0
    lastUploadedAt = hunt.uploads.summary.lastUploadedAt
    teamCount = 1 // Single team
  }
  
  return {
    total: totalPhotos + totalVideos,
    photos: totalPhotos,
    videos: totalVideos,
    lastUploadedAt,
    teamCount
  }
}

export const eventsListHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string || formatDateYYYYMMDD(new Date())
    
    console.log(`🗓️ EventsRoute: Fetching ALL org/hunt events (ignoring date filter: ${date})`)
    
    // Load App JSON to get all organizations
    const appResult = await orgRegistryService.loadApp()
    if (!appResult.success) {
      console.log('📭 EventsRoute: No App JSON found, returning empty list')
      res.json({ events: [] })
      return
    }
    
    const app = appResult.data
    const events: EventListItem[] = []
    
    console.log(`🔍 EventsRoute: Loading all hunts from ${app.organizations.length} organizations`)
    
    // Load each organization and get ALL their hunts (ignore date filter)
    for (const orgSummary of app.organizations) {
      try {
        console.log(`📂 EventsRoute: Loading all hunts for organization: ${orgSummary.orgSlug}`)
        
        const orgResult = await orgRegistryService.loadOrg(orgSummary.orgSlug)
        if (!orgResult.success) {
          console.warn(`⚠️ EventsRoute: Failed to load org ${orgSummary.orgSlug}:`, orgResult.error)
          continue
        }
        
        const org = orgResult.data
        
        // Add ALL hunts from this organization (no date filtering)
        for (const hunt of org.hunts) {
          const eventItem: EventListItem = {
            key: `events/${hunt.startDate}/${orgSummary.orgSlug}/${hunt.id}`,
            orgSlug: orgSummary.orgSlug,
            orgName: org.org.orgName,
            eventName: hunt.name,
            huntId: hunt.id,
            startDate: hunt.startDate,
            endDate: hunt.endDate,
            status: hunt.status,
            uploads: extractUploadSummary(hunt)
          }
          
          events.push(eventItem)
          
          console.log(`✅ EventsRoute: Added event: ${org.org.orgName} - ${hunt.name} (${eventItem.uploads.total} uploads: ${eventItem.uploads.photos} photos, ${eventItem.uploads.videos} videos)`)
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
    
    const totalUploads = events.reduce((sum, e) => sum + e.uploads.total, 0)
    const totalPhotos = events.reduce((sum, e) => sum + e.uploads.photos, 0)
    const totalVideos = events.reduce((sum, e) => sum + e.uploads.videos, 0)
    
    console.log(`📋 EventsRoute: Returning ${events.length} total events from all organizations (date filter ignored: ${date})`)
    console.log(`📊 EventsRoute: Upload totals - ${totalUploads} uploads (${totalPhotos} photos, ${totalVideos} videos)`)
    console.log('📊 EventsRoute: Events list:', events.map(e => `${e.orgName} - ${e.eventName}`))
    
    res.json({ 
      date,
      events,
      count: events.length,
      uploadSummary: {
        total: totalUploads,
        photos: totalPhotos,
        videos: totalVideos
      }
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
            status: hunt.status,
            uploads: extractUploadSummary(hunt)
          }
          
          events.push(eventItem)
          
          console.log(`✅ EventsRoute: Added event: ${org.org.orgName} - ${hunt.name} (${hunt.status}) - ${eventItem.uploads.total} uploads: ${eventItem.uploads.photos} photos, ${eventItem.uploads.videos} videos`)
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
    
    const totalUploads = events.reduce((sum, e) => sum + e.uploads.total, 0)
    const totalPhotos = events.reduce((sum, e) => sum + e.uploads.photos, 0)
    const totalVideos = events.reduce((sum, e) => sum + e.uploads.videos, 0)
    
    console.log(`📋 EventsRoute: Returning ${events.length} total events across all orgs`)
    console.log(`📊 EventsRoute: Upload totals - ${totalUploads} uploads (${totalPhotos} photos, ${totalVideos} videos)`)
    
    res.json({ 
      events,
      count: events.length,
      organizationCount: app.organizations.length,
      uploadSummary: {
        total: totalUploads,
        photos: totalPhotos,
        videos: totalVideos
      }
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