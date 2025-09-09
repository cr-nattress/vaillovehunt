#!/usr/bin/env tsx

/**
 * Script to load app.json into PRODUCTION Azure Tables (not local emulator)
 * Forces cloud storage by overriding Azurite flag
 */

import { AppDataSchema, type AppData } from '../src/types/appData.schemas.js'

// Override flags to force production Azure usage
process.env.ENABLE_AZURITE_LOCAL = 'false'
process.env.NODE_ENV = 'production'

// Import after setting environment to ensure proper configuration
const { AzureTableService } = await import('../src/services/AzureTableService.js')

async function loadAppDataToCloud() {
  console.log('🚀 Loading app.json into PRODUCTION Azure Tables...')
  console.log('🌐 Target: scavengerapp.table.core.windows.net')
  
  const azureService = new AzureTableService()
  
  // Define the app data
  const appData: AppData = {
    schemaVersion: "1.0.0",
    updatedAt: new Date().toISOString(),
    app: {
      metadata: {
        name: "Vail Love Hunt",
        environment: "production",
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
    // Validate schema
    console.log('✅ Validating schema...')
    const validatedData = AppDataSchema.parse(appData)
    
    // Insert directly into cloud AppRegistry table
    console.log('💾 Inserting into PRODUCTION AppRegistry table...')
    const entity = {
      partitionKey: 'app',
      rowKey: 'config',
      data: JSON.stringify(validatedData),
      schemaVersion: validatedData.schemaVersion,
      updatedAt: validatedData.updatedAt
    }
    
    const result = await azureService.upsertEntity('AppRegistry', entity)
    
    console.log('🎉 Successfully loaded app.json to PRODUCTION Azure!')
    console.log('📊 Result:', {
      account: 'scavengerapp',
      table: 'vailAppRegistry',
      partitionKey: entity.partitionKey,
      rowKey: entity.rowKey,
      etag: result.etag,
      organizationCount: validatedData.organizations.length
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to load app.json to cloud:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log('🌐 Network connectivity issue - check internet connection')
      } else if (error.message.includes('AuthenticationFailed')) {
        console.log('🔑 Authentication failed - check Azure connection string')
      }
    }
    
    throw error
  }
}

loadAppDataToCloud()
  .then(() => {
    console.log('✨ Cloud script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cloud script failed:', error)
    process.exit(1)
  })