#!/usr/bin/env tsx

/**
 * Basic Azure Table Storage Test Script
 * 
 * Tests low-level Azure Table operations with Azurite emulator.
 * This bypasses schema validation to test core functionality.
 */

import { azureTableService } from '../src/services/AzureTableService'

interface TestEntity {
  partitionKey: string
  rowKey: string
  testData: string
  timestamp: string
}

async function testBasicOperations() {
  console.log('🧪 Testing Basic Azure Table Operations')
  
  try {
    // Test 1: Health Check
    console.log('1. Testing connection...')
    const health = await azureTableService.healthCheck()
    console.log('✅ Health Check:', health)
    
    if (!health.healthy) {
      throw new Error(`Health check failed: ${health.message}`)
    }

    // Test 2: Create and insert entity
    console.log('2. Inserting test entity...')
    const testEntity: TestEntity = {
      partitionKey: 'test-partition',
      rowKey: 'test-row-1',
      testData: 'Hello Azure Tables!',
      timestamp: new Date().toISOString()
    }
    
    const insertEtag = await azureTableService.upsertEntity('TestTable', testEntity)
    console.log('✅ Entity inserted with ETag:', insertEtag)

    // Test 3: Read entity back
    console.log('3. Reading test entity...')
    const readResult = await azureTableService.getEntity<TestEntity>('TestTable', 'test-partition', 'test-row-1')
    console.log('✅ Entity read:', {
      testData: readResult.data.testData,
      etag: readResult.etag
    })

    // Test 4: Query entities
    console.log('4. Querying entities...')
    const queryResults = await azureTableService.queryEntities<TestEntity>('TestTable', {
      filter: "PartitionKey eq 'test-partition'"
    })
    console.log('✅ Query results:', queryResults.length, 'entities found')

    // Test 5: Update entity
    console.log('5. Updating entity...')
    const updatedEntity = {
      ...testEntity,
      testData: 'Updated data!',
      timestamp: new Date().toISOString()
    }
    
    const updateEtag = await azureTableService.upsertEntity('TestTable', updatedEntity)
    console.log('✅ Entity updated with new ETag:', updateEtag)

    // Test 6: Delete entity
    console.log('6. Deleting entity...')
    await azureTableService.deleteEntity('TestTable', 'test-partition', 'test-row-1', updateEtag)
    console.log('✅ Entity deleted')

    return true
  } catch (error) {
    console.error('❌ Basic operations test failed:', error)
    throw error
  }
}

async function testMultipleEntities() {
  console.log('🧪 Testing Multiple Entity Operations')
  
  try {
    const entities = [
      { partitionKey: 'batch-1', rowKey: 'item-1', data: 'First item', value: 100 },
      { partitionKey: 'batch-1', rowKey: 'item-2', data: 'Second item', value: 200 },
      { partitionKey: 'batch-2', rowKey: 'item-1', data: 'Third item', value: 150 },
    ]

    // Insert multiple entities
    console.log('1. Inserting multiple entities...')
    const etags = []
    for (const entity of entities) {
      const etag = await azureTableService.upsertEntity('MultiTable', entity)
      etags.push(etag)
    }
    console.log('✅ Inserted', entities.length, 'entities')

    // Query by partition
    console.log('2. Querying by partition...')
    const batch1Results = await azureTableService.queryEntities('MultiTable', {
      filter: "PartitionKey eq 'batch-1'"
    })
    console.log('✅ Found', batch1Results.length, 'entities in batch-1')

    // Query all entities
    console.log('3. Querying all entities...')
    const allResults = await azureTableService.queryEntities('MultiTable')
    console.log('✅ Found', allResults.length, 'total entities')

    // Clean up
    console.log('4. Cleaning up entities...')
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]
      await azureTableService.deleteEntity('MultiTable', entity.partitionKey, entity.rowKey)
    }
    console.log('✅ Cleaned up all entities')

    return true
  } catch (error) {
    console.error('❌ Multiple entities test failed:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting Basic Azure Table Storage Test')
  console.log('📍 Using Azurite emulator (NOT production Azure)')
  console.log('🔴 NO MOCK DATA - Testing real Azure Table operations\n')

  try {
    // Basic operations test
    await testBasicOperations()
    console.log('')

    // Multiple entities test
    await testMultipleEntities()
    console.log('')

    console.log('✅ All basic tests completed successfully!')
    console.log('🎉 Azure Table Storage is working correctly with Azurite')
    
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