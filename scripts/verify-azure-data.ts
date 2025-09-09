#!/usr/bin/env tsx

/**
 * Script to verify what data exists in Azure Tables
 */

import { AzureTableService } from '../src/services/AzureTableService.js'

async function verifyAzureData() {
  console.log('🔍 Checking Azure Tables for existing data...')
  
  try {
    const azureService = new AzureTableService()
    
    // Check the AppRegistry table specifically
    console.log('📋 Querying AppRegistry table...')
    
    const entities = await azureService.queryEntities('AppRegistry')
    console.log(`✅ Found ${entities.length} entities in AppRegistry table`)
    
    for (const entity of entities) {
      console.log('📄 Entity:', {
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        timestamp: entity.timestamp,
        etag: entity.etag,
        dataKeys: Object.keys(entity).filter(k => !['partitionKey', 'rowKey', 'timestamp', 'etag'].includes(k))
      })
    }
    
    // Also check OrgData table
    console.log('\n📋 Querying OrgData table...')
    const orgEntities = await azureService.queryEntities('OrgData')
    console.log(`✅ Found ${orgEntities.length} entities in OrgData table`)
    
    for (const entity of orgEntities) {
      console.log('📄 Entity:', {
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        timestamp: entity.timestamp,
        etag: entity.etag
      })
    }
    
  } catch (error) {
    console.error('❌ Failed to verify Azure data:', error)
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Azurite doesn\'t seem to be running. Start it with:')
      console.log('azurite --location ./azurite-data')
    }
    
    throw error
  }
}

verifyAzureData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))