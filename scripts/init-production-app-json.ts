#!/usr/bin/env tsx

/**
 * Script to initialize app.json in production Netlify Blobs KV store
 * This creates the global application registry needed for the app to work
 */

import { DualWriteService } from '../src/client/DualWriteService'

const INITIAL_APP_DATA = {
  schemaVersion: "1.2.0",
  updatedAt: new Date().toISOString(),
  app: {
    metadata: {
      name: "Team Hunt",
      environment: "production", 
      uiVersion: "1.0.0"
    },
    features: {
      enableKVEvents: true,
      enableBlobEvents: true,
      enablePhotoUpload: true,
      enableMapPage: false
    },
    defaults: {
      timezone: "America/Denver",
      locale: "en-US"
    },
    limits: {
      maxUploadSizeMB: 10,
      maxPhotosPerTeam: 100,
      allowedMediaTypes: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  organizations: [
    {
      orgSlug: "bhhs",
      orgName: "Berkshire Hathaway HomeServices",
      primaryContactEmail: "contact@bhhs.com",
      createdAt: new Date().toISOString(),
      orgBlobKey: "orgs/bhhs.json",
      summary: {
        huntsTotal: 1,
        teamsCommon: ["RED", "BLUE", "GREEN", "PINK"]
      }
    }
  ],
  byDate: {
    [new Date().toISOString().split('T')[0]]: [
      {
        orgSlug: "bhhs",
        huntId: "vail-hunt-2025"
      }
    ]
  }
}

async function initializeProductionAppJson() {
  console.log('🚀 Initializing app.json in production Netlify Blobs KV store...')
  
  try {
    // Check if app.json already exists
    console.log('🔍 Checking if app.json already exists...')
    const existing = await DualWriteService.get('app.json')
    
    if (existing) {
      console.log('⚠️  app.json already exists:', existing)
      console.log('❓ Do you want to overwrite it? This script will exit now.')
      console.log('💡 To force overwrite, modify this script to skip the existence check.')
      return
    }
    
    // Create the app.json data
    console.log('💾 Creating app.json with initial data...')
    const result = await DualWriteService.set('app.json', INITIAL_APP_DATA)
    
    if (result.server) {
      console.log('✅ Successfully created app.json in production!')
      console.log('📊 Data summary:')
      console.log('  - Organizations:', INITIAL_APP_DATA.organizations.length)
      console.log('  - Schema version:', INITIAL_APP_DATA.schemaVersion)
      console.log('  - Date entries:', Object.keys(INITIAL_APP_DATA.byDate).length)
      console.log('  - Features enabled:', Object.entries(INITIAL_APP_DATA.app.features)
        .filter(([_, enabled]) => enabled).map(([key]) => key).join(', '))
    } else {
      console.error('❌ Failed to store app.json on server')
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors)
      }
    }
    
    // Verify the data was stored
    console.log('🔍 Verifying app.json was stored correctly...')
    const verification = await DualWriteService.get('app.json')
    
    if (verification) {
      console.log('✅ Verification successful - app.json is now available')
      console.log('🌐 You can test it at: https://teamhunt.pro/.netlify/functions/kv-get?key=app.json')
    } else {
      console.error('❌ Verification failed - app.json not found after creation')
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize app.json:', error)
    throw error
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeProductionAppJson()
    .then(() => {
      console.log('✨ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

export { initializeProductionAppJson }