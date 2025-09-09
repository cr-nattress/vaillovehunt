/**
 * Lead Capture Service
 * 
 * Handles customer lead management, storage, and follow-up workflows.
 * Integrates with existing blob storage infrastructure for persistence.
 */

import { BlobService } from './BlobService'
import { CustomerData } from '../store/customer.store'
import { slugify } from '../utils/slug'

/**
 * Lead data structure for storage
 */
export interface LeadRecord {
  id: string
  email: string
  firstName: string
  interests: string[]
  eventType?: 'corporate' | 'family' | 'date' | 'friends'
  preferredLocation?: string
  source?: 'organic' | 'referral' | 'social' | 'advertising'
  leadStatus: 'prospect' | 'qualified' | 'converted' | 'unqualified'
  contactPreferences?: {
    email: boolean
    sms: boolean
    frequency: 'immediate' | 'weekly' | 'monthly'
  }
  createdAt: string
  lastInteraction: string
  conversionDate?: string
  notes?: string[]
  campaignData?: {
    source: string
    medium: string
    campaign?: string
    term?: string
    content?: string
  }
  behaviorData?: {
    pageViews: number
    timeOnSite: number
    eventsCompleted: number
    lastEventDate?: string
  }
}

/**
 * Lead analytics and reporting data
 */
export interface LeadAnalytics {
  totalLeads: number
  newLeads: number
  qualifiedLeads: number
  convertedLeads: number
  conversionRate: number
  sourceBreakdown: Record<string, number>
  interestBreakdown: Record<string, number>
  eventTypeBreakdown: Record<string, number>
  timeSeriesData: {
    date: string
    leads: number
    conversions: number
  }[]
}

/**
 * Lead batch data for bulk operations
 */
export interface LeadBatch {
  leads: LeadRecord[]
  metadata: {
    batchId: string
    createdAt: string
    totalCount: number
    source: string
  }
}

/**
 * Lead Capture Service implementation
 */
export class LeadCaptureService {
  private static instance: LeadCaptureService
  private blobService: BlobService
  private readonly LEADS_COLLECTION = 'customer-leads'
  private readonly ANALYTICS_KEY = 'lead-analytics.json'
  
  private constructor() {
    this.blobService = new BlobService()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): LeadCaptureService {
    if (!LeadCaptureService.instance) {
      LeadCaptureService.instance = new LeadCaptureService()
    }
    return LeadCaptureService.instance
  }
  
  /**
   * Capture a new lead from customer data
   */
  async captureLead(customerData: CustomerData, source = 'organic'): Promise<LeadRecord> {
    try {
      console.log('📝 LeadCaptureService: Capturing new lead:', customerData.email)
      
      const leadId = `lead_${Date.now()}_${slugify(customerData.email)}`
      const now = new Date().toISOString()
      
      const leadRecord: LeadRecord = {
        id: leadId,
        email: customerData.email,
        firstName: customerData.firstName,
        interests: customerData.interests || [],
        eventType: customerData.eventType,
        preferredLocation: customerData.preferredLocation,
        source: customerData.source || source as LeadRecord['source'],
        leadStatus: customerData.leadStatus || 'prospect',
        contactPreferences: customerData.contactPreferences || {
          email: true,
          sms: false,
          frequency: 'weekly'
        },
        createdAt: customerData.createdAt || now,
        lastInteraction: now,
        notes: [],
        behaviorData: {
          pageViews: 1,
          timeOnSite: 0,
          eventsCompleted: 0
        }
      }
      
      // Store lead record
      await this.storeLead(leadRecord)
      
      // Update analytics
      await this.updateAnalytics(leadRecord)
      
      console.log('✅ LeadCaptureService: Lead captured successfully:', leadId)
      return leadRecord
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to capture lead:', error)
      throw new Error(`Failed to capture lead: ${error}`)
    }
  }
  
  /**
   * Update an existing lead record
   */
  async updateLead(leadId: string, updates: Partial<LeadRecord>): Promise<LeadRecord> {
    try {
      console.log('🔄 LeadCaptureService: Updating lead:', leadId)
      
      const existingLead = await this.getLead(leadId)
      if (!existingLead) {
        throw new Error(`Lead not found: ${leadId}`)
      }
      
      const updatedLead: LeadRecord = {
        ...existingLead,
        ...updates,
        lastInteraction: new Date().toISOString()
      }
      
      // Handle status changes
      if (updates.leadStatus === 'converted' && !existingLead.conversionDate) {
        updatedLead.conversionDate = new Date().toISOString()
      }
      
      await this.storeLead(updatedLead)
      await this.updateAnalytics(updatedLead)
      
      console.log('✅ LeadCaptureService: Lead updated successfully:', leadId)
      return updatedLead
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to update lead:', error)
      throw error
    }
  }
  
  /**
   * Get a specific lead by ID
   */
  async getLead(leadId: string): Promise<LeadRecord | null> {
    try {
      const leadKey = `${leadId}.json`
      const result = await this.blobService.getObject(this.LEADS_COLLECTION, leadKey)
      return result.data as LeadRecord
    } catch (error) {
      console.warn('⚠️ LeadCaptureService: Lead not found:', leadId)
      return null
    }
  }
  
  /**
   * Get lead by email address
   */
  async getLeadByEmail(email: string): Promise<LeadRecord | null> {
    try {
      const leads = await this.getAllLeads()
      return leads.find(lead => lead.email.toLowerCase() === email.toLowerCase()) || null
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to get lead by email:', error)
      return null
    }
  }
  
  /**
   * Get all leads with optional filtering
   */
  async getAllLeads(filter?: {
    status?: LeadRecord['leadStatus']
    source?: LeadRecord['source']
    interest?: string
    dateRange?: { start: string; end: string }
  }): Promise<LeadRecord[]> {
    try {
      console.log('📋 LeadCaptureService: Fetching all leads')
      
      const blobs = await this.blobService.listBlobs(this.LEADS_COLLECTION)
      const leads: LeadRecord[] = []
      
      for (const blob of blobs) {
        if (blob.key.endsWith('.json') && blob.key !== this.ANALYTICS_KEY) {
          try {
            const result = await this.blobService.getObject(this.LEADS_COLLECTION, blob.key)
            const lead = result.data as LeadRecord
            
            // Apply filters
            if (filter) {
              if (filter.status && lead.leadStatus !== filter.status) continue
              if (filter.source && lead.source !== filter.source) continue
              if (filter.interest && !lead.interests.includes(filter.interest)) continue
              if (filter.dateRange) {
                const createdAt = new Date(lead.createdAt).getTime()
                const start = new Date(filter.dateRange.start).getTime()
                const end = new Date(filter.dateRange.end).getTime()
                if (createdAt < start || createdAt > end) continue
              }
            }
            
            leads.push(lead)
          } catch (error) {
            console.warn('⚠️ LeadCaptureService: Failed to parse lead:', blob.key)
          }
        }
      }
      
      // Sort by creation date (newest first)
      leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      console.log('✅ LeadCaptureService: Loaded', leads.length, 'leads')
      return leads
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to get leads:', error)
      return []
    }
  }
  
  /**
   * Convert a lead to customer
   */
  async convertLead(leadId: string, notes?: string): Promise<LeadRecord> {
    try {
      console.log('🎯 LeadCaptureService: Converting lead:', leadId)
      
      const updates: Partial<LeadRecord> = {
        leadStatus: 'converted',
        conversionDate: new Date().toISOString()
      }
      
      if (notes) {
        const existingLead = await this.getLead(leadId)
        updates.notes = [...(existingLead?.notes || []), notes]
      }
      
      return await this.updateLead(leadId, updates)
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to convert lead:', error)
      throw error
    }
  }
  
  /**
   * Add behavioral data to lead
   */
  async trackBehavior(leadId: string, behaviorUpdate: Partial<LeadRecord['behaviorData']>): Promise<void> {
    try {
      const lead = await this.getLead(leadId)
      if (!lead) return
      
      const updatedBehavior = {
        ...lead.behaviorData,
        ...behaviorUpdate
      }
      
      await this.updateLead(leadId, { behaviorData: updatedBehavior })
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to track behavior:', error)
    }
  }
  
  /**
   * Get lead analytics and metrics
   */
  async getAnalytics(dateRange?: { start: string; end: string }): Promise<LeadAnalytics> {
    try {
      console.log('📊 LeadCaptureService: Generating analytics')
      
      const leads = await this.getAllLeads(dateRange ? { dateRange } : undefined)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const newLeads = leads.filter(lead => 
        new Date(lead.createdAt) >= thirtyDaysAgo
      ).length
      
      const qualifiedLeads = leads.filter(lead => 
        lead.leadStatus === 'qualified'
      ).length
      
      const convertedLeads = leads.filter(lead => 
        lead.leadStatus === 'converted'
      ).length
      
      const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0
      
      // Source breakdown
      const sourceBreakdown: Record<string, number> = {}
      leads.forEach(lead => {
        const source = lead.source || 'unknown'
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
      })
      
      // Interest breakdown
      const interestBreakdown: Record<string, number> = {}
      leads.forEach(lead => {
        lead.interests.forEach(interest => {
          interestBreakdown[interest] = (interestBreakdown[interest] || 0) + 1
        })
      })
      
      // Event type breakdown
      const eventTypeBreakdown: Record<string, number> = {}
      leads.forEach(lead => {
        if (lead.eventType) {
          eventTypeBreakdown[lead.eventType] = (eventTypeBreakdown[lead.eventType] || 0) + 1
        }
      })
      
      // Time series data (last 30 days)
      const timeSeriesData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayLeads = leads.filter(lead => 
          lead.createdAt.startsWith(dateStr)
        ).length
        
        const dayConversions = leads.filter(lead => 
          lead.conversionDate && lead.conversionDate.startsWith(dateStr)
        ).length
        
        timeSeriesData.push({
          date: dateStr,
          leads: dayLeads,
          conversions: dayConversions
        })
      }
      
      const analytics: LeadAnalytics = {
        totalLeads: leads.length,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        sourceBreakdown,
        interestBreakdown,
        eventTypeBreakdown,
        timeSeriesData
      }
      
      console.log('✅ LeadCaptureService: Analytics generated:', analytics)
      return analytics
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to generate analytics:', error)
      throw error
    }
  }
  
  /**
   * Export leads data for reporting
   */
  async exportLeads(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const leads = await this.getAllLeads()
      
      if (format === 'json') {
        return JSON.stringify(leads, null, 2)
      }
      
      if (format === 'csv') {
        const headers = [
          'ID', 'Email', 'FirstName', 'Interests', 'EventType', 'Source', 
          'LeadStatus', 'CreatedAt', 'LastInteraction', 'ConversionDate'
        ]
        
        const csvRows = [headers.join(',')]
        
        leads.forEach(lead => {
          const row = [
            lead.id,
            lead.email,
            lead.firstName,
            lead.interests.join(';'),
            lead.eventType || '',
            lead.source || '',
            lead.leadStatus,
            lead.createdAt,
            lead.lastInteraction,
            lead.conversionDate || ''
          ]
          csvRows.push(row.map(field => `"${field}"`).join(','))
        })
        
        return csvRows.join('\n')
      }
      
      throw new Error(`Unsupported export format: ${format}`)
      
    } catch (error) {
      console.error('❌ LeadCaptureService: Failed to export leads:', error)
      throw error
    }
  }
  
  /**
   * Store lead record to blob storage
   */
  private async storeLead(lead: LeadRecord): Promise<void> {
    const leadKey = `${lead.id}.json`
    await this.blobService.upsertObject(this.LEADS_COLLECTION, leadKey, lead)
  }
  
  /**
   * Update analytics data
   */
  private async updateAnalytics(lead: LeadRecord): Promise<void> {
    try {
      // For now, we'll regenerate analytics on demand
      // In a production system, we might want to maintain running totals
      console.log('📊 LeadCaptureService: Analytics will be updated on next request')
    } catch (error) {
      console.warn('⚠️ LeadCaptureService: Failed to update analytics:', error)
    }
  }
}

/**
 * Singleton instance export
 */
export const leadCaptureService = LeadCaptureService.getInstance()

/**
 * Helper functions for lead management
 */

/**
 * Convert CustomerData to LeadRecord
 */
export function customerDataToLeadRecord(customerData: CustomerData, source = 'organic'): Omit<LeadRecord, 'id'> {
  const now = new Date().toISOString()
  
  return {
    email: customerData.email,
    firstName: customerData.firstName,
    interests: customerData.interests || [],
    eventType: customerData.eventType,
    preferredLocation: customerData.preferredLocation,
    source: customerData.source || source as LeadRecord['source'],
    leadStatus: customerData.leadStatus || 'prospect',
    contactPreferences: customerData.contactPreferences || {
      email: true,
      sms: false,
      frequency: 'weekly'
    },
    createdAt: customerData.createdAt || now,
    lastInteraction: now,
    notes: [],
    behaviorData: {
      pageViews: 1,
      timeOnSite: 0,
      eventsCompleted: 0
    }
  }
}

/**
 * Validate lead data before storage
 */
export function validateLeadData(lead: Partial<LeadRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!lead.email || !lead.email.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.push('Email format is invalid')
  }
  
  if (!lead.firstName || !lead.firstName.trim()) {
    errors.push('First name is required')
  }
  
  if (!lead.interests || !Array.isArray(lead.interests) || lead.interests.length === 0) {
    errors.push('At least one interest is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}