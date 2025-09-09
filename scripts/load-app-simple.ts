#!/usr/bin/env tsx

/**
 * Simple script to directly load app.json into Azure Tables
 * Bypasses complex adapter initialization that may be hanging
 */

import { AzureTableService } from '../src/services/AzureTableService.js'
import { AppDataSchema, type AppData } from '../src/types/appData.schemas.js'

async function loadAppDataDirect() {
  console.log('🚀 Loading app.json directly into Azure Tables...')
  
  const azureService = new AzureTableService()
  
  // Define the app data
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
    // Validate schema
    console.log('✅ Validating schema...')
    const validatedData = AppDataSchema.parse(appData)
    
    // Insert directly into AppRegistry table
    console.log('💾 Inserting into AppRegistry table...')
    const entity = {
      partitionKey: 'app',
      rowKey: 'config',
      data: JSON.stringify(validatedData),
      schemaVersion: validatedData.schemaVersion,
      updatedAt: validatedData.updatedAt
    }
    
    const result = await azureService.upsertEntity('AppRegistry', entity)
    
    console.log('🎉 Successfully loaded app.json!')
    console.log('📊 Result:', {
      table: 'AppRegistry',
      partitionKey: entity.partitionKey,
      rowKey: entity.rowKey,
      etag: result.etag
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to load app.json:', error)
    throw error
  }
}

loadAppDataDirect()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })