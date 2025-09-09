#!/usr/bin/env tsx

/**
 * Script to load app.json into Azure Tables using explicit connection string
 * Bypasses DefaultAzureCredential authentication issues
 */

import dotenv from 'dotenv'
import { TableClient } from '@azure/data-tables'
import { AppDataSchema, type AppData } from '../src/types/appData.schemas.js'

// Load environment variables
dotenv.config()

async function loadAppDataWithConnectionString() {
  console.log('🚀 Loading app.json into Azure Tables via connection string...')
  
  // Get connection string from environment
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING not found in environment')
  }
  
  console.log('🌐 Using Azure account: scavengerapp')
  
  // Create table client directly with connection string
  const tableName = 'vailAppRegistry'
  const client = TableClient.fromConnectionString(connectionString, tableName)
  
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
    
    // Create table if it doesn't exist
    console.log('📊 Creating table if needed...')
    await client.createTable()
    
    // Insert entity
    console.log('💾 Inserting app.json entity...')
    const entity = {
      partitionKey: 'app',
      rowKey: 'config',
      data: JSON.stringify(validatedData),
      schemaVersion: validatedData.schemaVersion,
      updatedAt: validatedData.updatedAt
    }
    
    const result = await client.upsertEntity(entity, 'Replace')
    
    console.log('🎉 Successfully loaded app.json to Azure Tables!')
    console.log('📊 Result:', {
      account: 'scavengerapp',
      table: tableName,
      partitionKey: entity.partitionKey,
      rowKey: entity.rowKey,
      etag: result.etag,
      organizationCount: validatedData.organizations.length
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to load app.json to Azure:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log('🌐 Network connectivity issue')
      } else if (error.message.includes('Authentication')) {
        console.log('🔑 Authentication failed - check Azure connection string')
      }
    }
    
    throw error
  }
}

loadAppDataWithConnectionString()
  .then(() => {
    console.log('✨ Successfully loaded to Azure Tables')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })