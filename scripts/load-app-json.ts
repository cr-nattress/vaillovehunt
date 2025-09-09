#!/usr/bin/env tsx

/**
 * One-time script to load initial app.json into Azure storage
 * Creates the global application registry with default configuration
 */

import { AzureTableOrgRepoAdapter } from '../src/infra/storage/azure.table.adapter'
import { AppDataSchema, type AppData } from '../src/types/appData.schemas'

async function loadInitialAppJson() {
  console.log('🚀 Loading initial app.json into Azure storage...')
  
  // Initialize Azure Table Org Repository Adapter (handles AppRegistry schema)
  const orgAdapter = new AzureTableOrgRepoAdapter()
  
  // Define the initial app.json structure
  const appData: AppData = {
    schemaVersion: "1.0.0",
    updatedAt: new Date().toISOString(),
    app: {
      metadata: {
        name: "Vail Love Hunt",
        environment: "development",
        uiVersion: "1.0.0"
      },
      features: {
        enableKVEvents: false,
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
        allowedMediaTypes: ["image/jpeg", "image/png"]
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
  
  try {
    // Validate the data against the schema
    console.log('✅ Validating app data schema...')
    const validatedData = AppDataSchema.parse(appData)
    
    // Store using the AppRegistry schema via the adapter
    console.log('💾 Storing app.json in Azure Tables (AppRegistry/app:config)...')
    const etag = await orgAdapter.upsertApp({ appData: validatedData })
    
    console.log('🎉 Successfully loaded app.json into Azure storage!')
    console.log('📊 Result:', {
      table: 'AppRegistry',
      partitionKey: 'app',
      rowKey: 'config',
      organizationCount: validatedData.organizations.length,
      dateIndexEntries: Object.keys(validatedData.byDate || {}).length,
      etag
    })
    
    return { etag }
    
  } catch (error) {
    console.error('❌ Failed to load app.json:', error)
    throw error
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadInitialAppJson()
    .then(() => {
      console.log('✨ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

export { loadInitialAppJson }