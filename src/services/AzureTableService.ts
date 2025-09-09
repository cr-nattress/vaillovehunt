/**
 * Azure Table Service - Low-level Azure Table Storage abstraction
 * 
 * Provides a clean interface for Azure Table operations with ETag support,
 * connection management, and error handling for the storage migration.
 */

import { TableClient, TableEntity, odata } from '@azure/data-tables'
import { DefaultAzureCredential } from '@azure/identity'
import { getFlag } from '../config/flags'

export interface AzureTableEntity {
  partitionKey: string
  rowKey: string
  timestamp?: Date
  etag?: string
  [key: string]: any
}

export interface TableResult<T = AzureTableEntity> {
  data: T
  etag?: string
}

export interface UpsertOptions {
  expectedEtag?: string
  mode?: 'merge' | 'replace'
}

export interface QueryOptions {
  filter?: string
  select?: string[]
  maxResults?: number
}

/**
 * Configuration for Azure Table Service
 */
interface AzureTableConfig {
  connectionString?: string
  accountName?: string
  tablePrefix?: string
  useAzurite: boolean
  enableRetries: boolean
}

/**
 * Azure Table Service implementation
 */
export class AzureTableService {
  private static instance: AzureTableService
  private config: AzureTableConfig
  private clients: Map<string, TableClient> = new Map()

  private constructor() {
    this.config = this.loadConfig()
    console.log('☁️ AzureTableService initialized:', {
      useAzurite: this.config.useAzurite,
      accountName: this.config.accountName,
      tablePrefix: this.config.tablePrefix
    })
  }

  static getInstance(): AzureTableService {
    if (!AzureTableService.instance) {
      AzureTableService.instance = new AzureTableService()
    }
    return AzureTableService.instance
  }

  /**
   * Load configuration from environment and feature flags
   */
  private loadConfig(): AzureTableConfig {
    const useAzurite = getFlag('repository', 'enableAzuriteLocal')
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'devstoreaccount1'
    
    return {
      connectionString: useAzurite 
        ? 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;'
        : process.env.AZURE_STORAGE_CONNECTION_STRING,
      accountName,
      tablePrefix: process.env.AZURE_TABLE_PREFIX || 'vail',
      useAzurite,
      enableRetries: true
    }
  }

  /**
   * Get or create a table client for the specified table
   */
  private async getTableClient(tableName: string): Promise<TableClient> {
    const fullTableName = `${this.config.tablePrefix}${tableName}`
    
    if (this.clients.has(fullTableName)) {
      return this.clients.get(fullTableName)!
    }

    let client: TableClient

    if (this.config.connectionString) {
      // For Azurite, we need to allow insecure connections
      const clientOptions = this.config.useAzurite ? {
        allowInsecureConnection: true
      } : {}
      
      client = TableClient.fromConnectionString(
        this.config.connectionString, 
        fullTableName,
        clientOptions
      )
    } else if (this.config.accountName) {
      const credential = new DefaultAzureCredential()
      client = new TableClient(
        `https://${this.config.accountName}.table.core.windows.net`,
        fullTableName,
        credential
      )
    } else {
      throw new Error('Azure Table Storage not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME')
    }

    // Create table if it doesn't exist
    try {
      await client.createTable()
      console.log(`📊 Created Azure table: ${fullTableName}`)
    } catch (error) {
      // Table might already exist, which is fine
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('TableAlreadyExists')) {
        console.warn(`⚠️ Failed to create table ${fullTableName}:`, errorMessage)
      }
    }

    this.clients.set(fullTableName, client)
    return client
  }

  /**
   * Get an entity by partition key and row key
   */
  async getEntity<T = AzureTableEntity>(
    tableName: string, 
    partitionKey: string, 
    rowKey: string
  ): Promise<TableResult<T>> {
    try {
      console.log(`🔍 AzureTableService: Get entity ${tableName}/${partitionKey}/${rowKey}`)
      
      const client = await this.getTableClient(tableName)
      const entity = await client.getEntity<TableEntity & T>(partitionKey, rowKey)
      
      return {
        data: entity as T,
        etag: entity.etag
      }
    } catch (error) {
      console.error(`❌ AzureTableService: Failed to get entity:`, error)
      throw error
    }
  }

  /**
   * Query entities with optional filtering
   */
  async queryEntities<T = AzureTableEntity>(
    tableName: string,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      console.log(`🔍 AzureTableService: Query entities from ${tableName}`, options)
      
      const client = await this.getTableClient(tableName)
      const entities: T[] = []
      
      const queryOptions: any = {}
      if (options?.select) {
        queryOptions.select = options.select
      }

      const filter = options?.filter
      const entitiesIterator = client.listEntities<TableEntity & T>({
        queryOptions: { filter, ...queryOptions }
      })

      for await (const entity of entitiesIterator) {
        entities.push(entity as T)
        if (options?.maxResults && entities.length >= options.maxResults) {
          break
        }
      }
      
      console.log(`✅ AzureTableService: Found ${entities.length} entities`)
      return entities
    } catch (error) {
      console.error(`❌ AzureTableService: Failed to query entities:`, error)
      throw error
    }
  }

  /**
   * Upsert an entity with optional optimistic concurrency
   */
  async upsertEntity<T = AzureTableEntity>(
    tableName: string,
    entity: T & { partitionKey: string; rowKey: string },
    options?: UpsertOptions
  ): Promise<string | undefined> {
    try {
      console.log(`💾 AzureTableService: Upsert entity ${tableName}/${entity.partitionKey}/${entity.rowKey}`)
      
      const client = await this.getTableClient(tableName)
      
      const tableEntity: TableEntity = {
        ...entity,
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey
      }

      // Configure upsert options according to Azure SDK format
      const upsertOptions: any = {}
      
      if (options?.expectedEtag) {
        upsertOptions.etag = options.expectedEtag
        const result = await client.upsertEntity(tableEntity, upsertOptions)
        return result.etag
      }

      const result = await client.upsertEntity(tableEntity)
      
      console.log(`✅ AzureTableService: Upsert successful, ETag: ${result.etag}`)
      return result.etag
    } catch (error) {
      console.error(`❌ AzureTableService: Failed to upsert entity:`, error)
      throw error
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(
    tableName: string,
    partitionKey: string,
    rowKey: string,
    etag?: string
  ): Promise<void> {
    try {
      console.log(`🗑️ AzureTableService: Delete entity ${tableName}/${partitionKey}/${rowKey}`)
      
      const client = await this.getTableClient(tableName)
      await client.deleteEntity(partitionKey, rowKey, { etag: etag || '*' })
      
      console.log(`✅ AzureTableService: Delete successful`)
    } catch (error) {
      console.error(`❌ AzureTableService: Failed to delete entity:`, error)
      throw error
    }
  }

  /**
   * Check if the service is properly configured and connected
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Try to get/create a health check table
      const client = await this.getTableClient('HealthCheck')
      await client.createTable()
      
      return {
        healthy: true,
        message: 'Azure Table Storage connected successfully'
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get current configuration for debugging
   */
  getConfig(): AzureTableConfig {
    return { ...this.config, connectionString: '[REDACTED]' }
  }
}

// Export singleton instance
export const azureTableService = AzureTableService.getInstance()
export default AzureTableService