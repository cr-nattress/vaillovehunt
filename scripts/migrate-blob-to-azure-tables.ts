#!/usr/bin/env tsx

/**
 * Blob to Azure Table Storage Migration Script
 * 
 * Migrates existing JSON data from Netlify Blobs to Azure Table Storage.
 * This script handles both app.json and organization data files.
 */

import { azureTableService } from '../src/services/AzureTableService'
import { BlobService } from '../src/services/BlobService'
import { AzureTableOrgRepoAdapter } from '../src/infra/storage/azure.table.adapter'
import type { AppData } from '../src/types/appData.schemas'
import type { OrgData } from '../src/types/orgData.schemas'

interface MigrationOptions {
  dryRun?: boolean
  backupExisting?: boolean
  overwriteExisting?: boolean
  orgSlugsOnly?: string[]
}

interface MigrationResult {
  success: boolean
  migratedApps: number
  migratedOrgs: number
  errors: Array<{ type: string; slug?: string; error: string }>
  warnings: Array<{ type: string; slug?: string; message: string }>
}

async function checkAzureConnection(): Promise<boolean> {
  console.log('🔍 Checking Azure Table Storage connection...')
  
  try {
    const health = await azureTableService.healthCheck()
    if (health.healthy) {
      console.log('✅ Azure Table Storage connected successfully')
      return true
    } else {
      console.error('❌ Azure Table Storage health check failed:', health.message)
      return false
    }
  } catch (error) {
    console.error('❌ Azure Table Storage connection failed:', error)
    return false
  }
}

async function checkBlobConnection(): Promise<boolean> {
  console.log('🔍 Checking Netlify Blobs connection...')
  
  try {
    const blobService = new BlobService()
    // Try to list blobs to test connection
    const appExists = await blobService.exists('app.json')
    console.log('✅ Netlify Blobs connected successfully')
    console.log(`📄 app.json exists: ${appExists}`)
    return true
  } catch (error) {
    console.error('❌ Netlify Blobs connection failed:', error)
    return false
  }
}

async function migrateAppData(
  blobService: BlobService, 
  azureRepo: AzureTableOrgRepoAdapter,
  options: MigrationOptions
): Promise<{ success: boolean; error?: string }> {
  console.log('📦 Migrating app.json...')
  
  try {
    // Check if app.json exists in blob storage
    const appExists = await blobService.exists('app.json')
    if (!appExists) {
      console.log('⚠️ app.json not found in blob storage, skipping migration')
      return { success: true }
    }

    // Fetch app data from blob storage
    const appResult = await blobService.getJSON<AppData>('app.json')
    const appData = appResult.data
    
    console.log(`📊 Found app data with ${appData.organizations.length} organizations`)
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN: Would migrate app.json with data:', {
        schemaVersion: appData.schemaVersion,
        organizationCount: appData.organizations.length,
        dateIndexEntries: Object.keys(appData.byDate || {}).length
      })
      return { success: true }
    }

    // Check if app data already exists in Azure Tables
    try {
      const existingApp = await azureRepo.getApp()
      if (existingApp && !options.overwriteExisting) {
        return { 
          success: false, 
          error: 'App data already exists in Azure Tables. Use --overwrite to replace it.' 
        }
      }
      console.log('⚠️ Overwriting existing app data in Azure Tables')
    } catch (error) {
      // App data doesn't exist, which is fine for migration
      console.log('✅ No existing app data found, proceeding with migration')
    }

    // Migrate app data to Azure Tables
    const etag = await azureRepo.upsertApp({ appData })
    console.log(`✅ App data migrated successfully, ETag: ${etag}`)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

async function migrateOrgData(
  blobService: BlobService,
  azureRepo: AzureTableOrgRepoAdapter,
  orgSlug: string,
  options: MigrationOptions
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏢 Migrating organization: ${orgSlug}`)
  
  try {
    const orgPath = `orgs/${orgSlug}.json`
    
    // Check if org data exists in blob storage
    const orgExists = await blobService.exists(orgPath)
    if (!orgExists) {
      return { 
        success: false, 
        error: `Organization file ${orgPath} not found in blob storage` 
      }
    }

    // Fetch org data from blob storage
    const orgResult = await blobService.getJSON<OrgData>(orgPath)
    const orgData = orgResult.data
    
    console.log(`📊 Found org data for ${orgData.org.orgName} with ${orgData.hunts.length} hunts`)
    
    if (options.dryRun) {
      console.log(`🔍 DRY RUN: Would migrate ${orgSlug} with data:`, {
        schemaVersion: orgData.schemaVersion,
        orgName: orgData.org.orgName,
        huntCount: orgData.hunts.length,
        contactCount: orgData.org.contacts.length
      })
      return { success: true }
    }

    // Check if org data already exists in Azure Tables
    try {
      const existingOrg = await azureRepo.getOrg({ orgSlug })
      if (existingOrg && !options.overwriteExisting) {
        return { 
          success: false, 
          error: `Organization ${orgSlug} already exists in Azure Tables. Use --overwrite to replace it.` 
        }
      }
      console.log(`⚠️ Overwriting existing org data for ${orgSlug} in Azure Tables`)
    } catch (error) {
      // Org data doesn't exist, which is fine for migration
      console.log(`✅ No existing org data found for ${orgSlug}, proceeding with migration`)
    }

    // Migrate org data to Azure Tables
    const etag = await azureRepo.upsertOrg({ orgSlug, orgData })
    console.log(`✅ Organization ${orgSlug} migrated successfully, ETag: ${etag}`)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}

async function discoverOrganizations(blobService: BlobService): Promise<string[]> {
  console.log('🔍 Discovering organizations in blob storage...')
  
  try {
    // First try to get the list from app.json
    const appExists = await blobService.exists('app.json')
    if (appExists) {
      const appResult = await blobService.getJSON<AppData>('app.json')
      const orgSlugs = appResult.data.organizations.map(org => org.orgSlug)
      console.log(`📋 Found ${orgSlugs.length} organizations in app.json:`, orgSlugs)
      return orgSlugs
    }

    // If app.json doesn't exist, we can't easily discover orgs in blob storage
    // since there's no list operation. Return empty array.
    console.log('⚠️ app.json not found, cannot discover organizations automatically')
    return []
  } catch (error) {
    console.error('❌ Failed to discover organizations:', error)
    return []
  }
}

async function runMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedApps: 0,
    migratedOrgs: 0,
    errors: [],
    warnings: []
  }

  console.log('🚀 Starting Blob to Azure Tables Migration')
  console.log('📍 Source: Netlify Blobs')
  console.log('📍 Target: Azure Table Storage (Azurite)')
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be modified')
  }
  
  try {
    // Check connections
    const azureConnected = await checkAzureConnection()
    const blobConnected = await checkBlobConnection()
    
    if (!azureConnected) {
      result.errors.push({
        type: 'connection',
        error: 'Azure Table Storage connection failed'
      })
      result.success = false
      return result
    }
    
    if (!blobConnected) {
      result.errors.push({
        type: 'connection',
        error: 'Netlify Blobs connection failed'
      })
      result.success = false
      return result
    }

    // Initialize services
    const blobService = new BlobService()
    const azureRepo = new AzureTableOrgRepoAdapter({
      strictValidation: false,  // More lenient during migration
      autoMigrate: true
    })

    // Migrate app data
    console.log('\n📦 === APP DATA MIGRATION ===')
    const appMigration = await migrateAppData(blobService, azureRepo, options)
    if (appMigration.success) {
      result.migratedApps = 1
      console.log('✅ App data migration completed')
    } else {
      result.errors.push({
        type: 'app',
        error: appMigration.error || 'Unknown app migration error'
      })
      console.error('❌ App data migration failed:', appMigration.error)
    }

    // Discover and migrate organizations
    console.log('\n🏢 === ORGANIZATION DATA MIGRATION ===')
    const orgSlugs = options.orgSlugsOnly || await discoverOrganizations(blobService)
    
    if (orgSlugs.length === 0) {
      console.log('⚠️ No organizations found to migrate')
    } else {
      console.log(`📋 Migrating ${orgSlugs.length} organizations...`)
      
      for (const orgSlug of orgSlugs) {
        const orgMigration = await migrateOrgData(blobService, azureRepo, orgSlug, options)
        if (orgMigration.success) {
          result.migratedOrgs++
          console.log(`✅ ${orgSlug} migration completed`)
        } else {
          result.errors.push({
            type: 'org',
            slug: orgSlug,
            error: orgMigration.error || 'Unknown org migration error'
          })
          console.error(`❌ ${orgSlug} migration failed:`, orgMigration.error)
        }
      }
    }

    return result
  } catch (error) {
    result.errors.push({
      type: 'system',
      error: error instanceof Error ? error.message : String(error)
    })
    result.success = false
    return result
  }
}

async function main() {
  console.log('🔄 Blob to Azure Tables Migration Tool')
  console.log('=====================================\n')

  // Parse command line arguments (simple implementation)
  const args = process.argv.slice(2)
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    backupExisting: args.includes('--backup'),
    overwriteExisting: args.includes('--overwrite')
  }

  // Check for specific org slugs
  const orgIndex = args.findIndex(arg => arg === '--orgs')
  if (orgIndex >= 0 && args[orgIndex + 1]) {
    options.orgSlugsOnly = args[orgIndex + 1].split(',')
  }

  console.log('⚙️ Migration options:', options)
  console.log('')

  try {
    const result = await runMigration(options)
    
    console.log('\n📊 === MIGRATION SUMMARY ===')
    console.log(`✅ App data migrated: ${result.migratedApps}`)
    console.log(`✅ Organizations migrated: ${result.migratedOrgs}`)
    console.log(`❌ Errors: ${result.errors.length}`)
    console.log(`⚠️ Warnings: ${result.warnings.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      result.errors.forEach(error => {
        console.log(`  - ${error.type}${error.slug ? ` (${error.slug})` : ''}: ${error.error}`)
      })
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:')
      result.warnings.forEach(warning => {
        console.log(`  - ${warning.type}${warning.slug ? ` (${warning.slug})` : ''}: ${warning.message}`)
      })
    }
    
    const success = result.success && result.errors.length === 0
    console.log(`\n${success ? '🎉 Migration completed successfully!' : '💥 Migration completed with errors'}`)
    process.exit(success ? 0 : 1)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
main().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})

export { runMigration, type MigrationOptions, type MigrationResult }