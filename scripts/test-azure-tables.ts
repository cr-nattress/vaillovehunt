#!/usr/bin/env tsx

/**
 * Azure Table Storage Test Script
 * 
 * Tests Azure Table adapters with real data using Azurite emulator.
 * This script does NOT use mock data - it tests the actual adapters.
 */

import { azureTableService } from '../src/services/AzureTableService'
import { AzureTableEventRepoAdapter, AzureTableOrgRepoAdapter } from '../src/infra/storage/azure.table.adapter'
import type { AppData } from '../src/types/appData.schemas'
import type { OrgData, Hunt } from '../src/types/orgData.schemas'

async function testAzureTableConnection() {
  console.log('🧪 Testing Azure Table Storage Connection (Azurite)')
  
  try {
    const health = await azureTableService.healthCheck()
    console.log('✅ Azure Table Service Health:', health)
    
    if (!health.healthy) {
      throw new Error(`Health check failed: ${health.message}`)
    }
  } catch (error) {
    console.error('❌ Azure Table Service connection failed:', error)
    throw error
  }
}

async function createTestAppData(): Promise<AppData> {
  return {
    schemaVersion: '1.2.0',
    updatedAt: new Date().toISOString(),
    app: {
      metadata: {
        name: 'Vail Love Hunt Test',
        environment: 'test'
      },
      features: {
        enableKVEvents: false,
        enableBlobEvents: false,
        enablePhotoUpload: true,
        enableMapPage: false
      },
      defaults: {
        timezone: 'America/Denver',
        locale: 'en-US'
      }
    },
    organizations: [
      {
        orgSlug: 'test-org',
        orgName: 'Test Organization',
        contactEmail: 'test@example.com',
        status: 'active'
      }
    ],
    byDate: {
      [new Date().toISOString().split('T')[0]]: [
        {
          orgSlug: 'test-org',
          huntId: 'test-hunt-2025',
          huntName: 'Test Hunt 2025'
        }
      ]
    }
  }
}

async function createTestOrgData(): Promise<OrgData> {
  const testHunt: Hunt = {
    id: 'test-hunt-2025',
    slug: 'test-hunt-2025',
    name: 'Test Hunt 2025',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'active',
    access: {
      visibility: 'public',
      pinRequired: false
    },
    scoring: {
      basePerStop: 10,
      bonusCreative: 5
    },
    moderation: {
      required: false,
      reviewers: []
    },
    stops: [
      {
        id: 'stop-1',
        title: 'Test Stop 1',
        description: 'First test stop',
        location: {
          lat: 39.6403,
          lng: -106.3742,
          address: '123 Test Street, Vail, CO'
        },
        media: {
          requirePhoto: true,
          requireVideo: false,
          allowMultiple: false
        },
        order: 1
      }
    ],
    location: {
      city: 'Vail',
      state: 'CO',
      zip: '81657'
    }
  }

  return {
    schemaVersion: '1.2.0',
    updatedAt: new Date().toISOString(),
    org: {
      orgSlug: 'test-org',
      orgName: 'Test Organization',
      contacts: [
        {
          firstName: 'Test',
          lastName: 'Admin',
          email: 'test@example.com',
          role: 'admin'
        }
      ],
      settings: {
        timezone: 'America/Denver',
        locale: 'en-US',
        theme: 'default'
      }
    },
    hunts: [testHunt]
  }
}

async function testOrgRepoAdapter() {
  console.log('🧪 Testing Azure Table Org Repository Adapter')
  
  const orgRepo = new AzureTableOrgRepoAdapter({
    strictValidation: false,
    autoMigrate: false
  })
  
  try {
    // Test 1: Create test app data
    console.log('📝 Creating test app data...')
    const testAppData = await createTestAppData()
    const appEtag = await orgRepo.upsertApp({ appData: testAppData })
    console.log('✅ App data created with ETag:', appEtag)

    // Test 2: Read app data back
    console.log('📖 Reading app data back...')
    const appResult = await orgRepo.getApp()
    console.log('✅ App data retrieved:', {
      orgCount: appResult.data.organizations.length,
      etag: appResult.etag
    })

    // Test 3: Create test org data
    console.log('📝 Creating test org data...')
    const testOrgData = await createTestOrgData()
    const orgEtag = await orgRepo.upsertOrg({
      orgSlug: 'test-org',
      orgData: testOrgData
    })
    console.log('✅ Org data created with ETag:', orgEtag)

    // Test 4: Read org data back
    console.log('📖 Reading org data back...')
    const orgResult = await orgRepo.getOrg({ orgSlug: 'test-org' })
    console.log('✅ Org data retrieved:', {
      orgName: orgResult.data.org.orgName,
      huntCount: orgResult.data.hunts.length,
      etag: orgResult.etag
    })

    // Test 5: List organizations
    console.log('📋 Listing organizations...')
    const orgs = await orgRepo.listOrgs()
    console.log('✅ Organizations listed:', orgs.map(org => ({
      slug: org.orgSlug,
      name: org.orgName,
      huntCount: org.huntCount
    })))

    return { appResult, orgResult, orgs }
  } catch (error) {
    console.error('❌ Org repo adapter test failed:', error)
    throw error
  }
}

async function testEventRepoAdapter() {
  console.log('🧪 Testing Azure Table Event Repository Adapter')
  
  const eventRepo = new AzureTableEventRepoAdapter()
  
  try {
    // Test 1: List today's events
    console.log('📅 Listing today\'s events...')
    const todayEvents = await eventRepo.listToday({})
    console.log('✅ Today\'s events:', todayEvents.map(event => ({
      orgSlug: event.orgSlug,
      huntId: event.huntId,
      huntName: event.huntName,
      status: event.status
    })))

    // Test 2: Get specific event
    if (todayEvents.length > 0) {
      const firstEvent = todayEvents[0]
      console.log('📖 Getting specific event...')
      const event = await eventRepo.getEvent({
        orgSlug: firstEvent.orgSlug,
        huntId: firstEvent.huntId
      })
      console.log('✅ Event retrieved:', {
        name: event.huntName,
        stops: event.stops.length,
        status: event.status
      })
      
      return { todayEvents, event }
    }

    return { todayEvents, event: null }
  } catch (error) {
    console.error('❌ Event repo adapter test failed:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting Azure Table Storage Integration Test')
  console.log('📍 Using Azurite emulator (NOT production Azure)')
  console.log('🔴 NO MOCK DATA - Testing real adapters\n')

  try {
    // Test Azure Table Service connection
    await testAzureTableConnection()
    console.log('')

    // Test Org Repository Adapter
    const orgResults = await testOrgRepoAdapter()
    console.log('')

    // Test Event Repository Adapter  
    const eventResults = await testEventRepoAdapter()
    console.log('')

    console.log('✅ All tests completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - Organizations: ${orgResults.orgs.length}`)
    console.log(`   - Today's Events: ${eventResults.todayEvents.length}`)
    console.log('   - Azure Tables: Connected via Azurite')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }
}

// Run the test
main().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})