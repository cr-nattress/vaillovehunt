#!/usr/bin/env tsx

/**
 * Test script to verify Azure Table storage connectivity
 */

import { AzureTableService } from '../src/services/AzureTableService.js'

async function testAzureConnection() {
  console.log('🔍 Testing Azure Table storage connection...')
  
  try {
    const azureService = new AzureTableService()
    
    // Test basic connectivity by attempting to list tables
    console.log('📋 Attempting to list tables...')
    
    // Simple test write/read
    const testData = { test: 'value', timestamp: new Date().toISOString() }
    console.log('✍️ Testing write operation...')
    
    const result = await azureService.upsert('test-key', testData)
    console.log('✅ Write successful:', result)
    
    console.log('📖 Testing read operation...')
    const readResult = await azureService.get('test-key')
    console.log('✅ Read successful:', readResult)
    
    console.log('🧹 Cleaning up test data...')
    await azureService.delete('test-key')
    
    console.log('🎉 Azure Table storage is working correctly!')
    
  } catch (error) {
    console.error('❌ Azure Table storage test failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    console.log('\n💡 Troubleshooting:')
    console.log('1. Make sure Azurite is running: azurite --location ./azurite-data')
    console.log('2. Check if port 10002 is available')
    console.log('3. Verify environment variables are set correctly')
    
    throw error
  }
}

// Run the test
testAzureConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))