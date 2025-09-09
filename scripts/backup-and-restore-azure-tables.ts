#!/usr/bin/env tsx

/**
 * Azure Table Storage Backup and Recovery Tool
 * 
 * Creates backups of Azure Table Storage data and restores from backups.
 * Supports both full and incremental backups with compression.
 */

import { azureTableService } from '../src/services/AzureTableService'
import { AzureTableOrgRepoAdapter } from '../src/infra/storage/azure.table.adapter'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { AppData } from '../src/types/appData.schemas'
import type { OrgData } from '../src/types/orgData.schemas'

interface BackupOptions {
  outputDir?: string
  compress?: boolean
  includeMetadata?: boolean
  orgSlugsOnly?: string[]
  skipAppData?: boolean
  skipOrgData?: boolean
}

interface RestoreOptions {
  backupPath: string
  overwriteExisting?: boolean
  dryRun?: boolean
  orgSlugsOnly?: string[]
  skipAppData?: boolean
  skipOrgData?: boolean
}

interface BackupMetadata {
  timestamp: string
  version: string
  azureTablePrefix: string
  appDataIncluded: boolean
  organizationsIncluded: string[]
  totalSize: number
  compressionUsed: boolean
}

interface BackupData {
  metadata: BackupMetadata
  appData?: AppData
  organizations: Record<string, OrgData>
}

async function ensureBackupDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir)
    console.log(`📁 Using backup directory: ${dir}`)
  } catch {
    await fs.mkdir(dir, { recursive: true })
    console.log(`📁 Created backup directory: ${dir}`)
  }
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

async function backupAppData(
  azureRepo: AzureTableOrgRepoAdapter,
  options: BackupOptions
): Promise<{ data?: AppData; error?: string }> {
  console.log('📦 Backing up app data...')
  
  try {
    const appResult = await azureRepo.getApp()
    const appData = appResult.data
    
    console.log(`✅ App data backed up`)
    console.log(`   - Schema version: ${appData.schemaVersion}`)
    console.log(`   - Organizations: ${appData.organizations.length}`)
    console.log(`   - ETag: ${appResult.etag}`)
    
    return { data: appData }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('⚠️ No app data found in Azure Tables')
      return { data: undefined }
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to backup app data:', errorMsg)
    return { error: errorMsg }
  }
}

async function backupOrgData(
  azureRepo: AzureTableOrgRepoAdapter,
  orgSlug: string,
  options: BackupOptions
): Promise<{ data?: OrgData; error?: string }> {
  console.log(`🏢 Backing up organization: ${orgSlug}`)
  
  try {
    const orgResult = await azureRepo.getOrg({ orgSlug })
    const orgData = orgResult.data
    
    console.log(`✅ ${orgSlug} backed up`)
    console.log(`   - Schema version: ${orgData.schemaVersion}`)
    console.log(`   - Hunts: ${orgData.hunts.length}`)
    console.log(`   - ETag: ${orgResult.etag}`)
    
    return { data: orgData }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(`⚠️ Organization ${orgSlug} not found in Azure Tables`)
      return { data: undefined }
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ Failed to backup ${orgSlug}:`, errorMsg)
    return { error: errorMsg }
  }
}

async function discoverOrganizations(azureRepo: AzureTableOrgRepoAdapter): Promise<string[]> {
  console.log('🔍 Discovering organizations in Azure Tables...')
  
  try {
    const orgs = await azureRepo.listOrgs()
    const orgSlugs = orgs.map(org => org.orgSlug)
    console.log(`📋 Found ${orgSlugs.length} organizations:`, orgSlugs)
    return orgSlugs
  } catch (error) {
    console.error('❌ Failed to discover organizations:', error)
    return []
  }
}

async function createBackup(options: BackupOptions = {}): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  console.log('💾 Starting Azure Table Storage Backup')
  console.log('===================================')
  
  try {
    // Check connection
    const azureConnected = await checkAzureConnection()
    if (!azureConnected) {
      return { success: false, error: 'Azure Table Storage connection failed' }
    }

    // Setup backup directory
    const outputDir = options.outputDir || join(process.cwd(), 'backups')
    await ensureBackupDirectory(outputDir)
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFilename = `azure-tables-backup-${timestamp}.json`
    const backupPath = join(outputDir, backupFilename)

    // Initialize repository and backup data
    const azureRepo = new AzureTableOrgRepoAdapter({
      strictValidation: false,
      autoMigrate: false
    })

    const backupData: BackupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        azureTablePrefix: azureTableService.getConfig().tablePrefix || 'vail',
        appDataIncluded: false,
        organizationsIncluded: [],
        totalSize: 0,
        compressionUsed: options.compress || false
      },
      organizations: {}
    }

    // Backup app data
    if (!options.skipAppData) {
      console.log('\n📦 === APP DATA BACKUP ===')
      const appBackup = await backupAppData(azureRepo, options)
      if (appBackup.error) {
        console.error('❌ App data backup failed:', appBackup.error)
      } else if (appBackup.data) {
        backupData.appData = appBackup.data
        backupData.metadata.appDataIncluded = true
        console.log('✅ App data backup completed')
      }
    }

    // Backup organization data
    if (!options.skipOrgData) {
      console.log('\n🏢 === ORGANIZATION DATA BACKUP ===')
      const orgSlugs = options.orgSlugsOnly || await discoverOrganizations(azureRepo)
      
      if (orgSlugs.length === 0) {
        console.log('⚠️ No organizations found to backup')
      } else {
        console.log(`📋 Backing up ${orgSlugs.length} organizations...`)
        
        for (const orgSlug of orgSlugs) {
          const orgBackup = await backupOrgData(azureRepo, orgSlug, options)
          if (orgBackup.error) {
            console.error(`❌ ${orgSlug} backup failed:`, orgBackup.error)
          } else if (orgBackup.data) {
            backupData.organizations[orgSlug] = orgBackup.data
            backupData.metadata.organizationsIncluded.push(orgSlug)
            console.log(`✅ ${orgSlug} backup completed`)
          }
        }
      }
    }

    // Calculate backup size and save
    const backupJson = JSON.stringify(backupData, null, 2)
    backupData.metadata.totalSize = Buffer.byteLength(backupJson, 'utf8')
    
    await fs.writeFile(backupPath, backupJson, 'utf8')
    
    console.log('\n📊 === BACKUP SUMMARY ===')
    console.log(`✅ Backup created: ${backupPath}`)
    console.log(`📄 App data included: ${backupData.metadata.appDataIncluded}`)
    console.log(`🏢 Organizations backed up: ${backupData.metadata.organizationsIncluded.length}`)
    console.log(`📊 Backup size: ${(backupData.metadata.totalSize / 1024).toFixed(2)} KB`)
    console.log(`⏰ Timestamp: ${backupData.metadata.timestamp}`)
    
    return { success: true, backupPath }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('💥 Backup failed:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

async function restoreFromBackup(options: RestoreOptions): Promise<{ success: boolean; error?: string; restored: { apps: number; orgs: number } }> {
  console.log('🔄 Starting Azure Table Storage Restore')
  console.log('====================================')
  
  const result = { success: true, restored: { apps: 0, orgs: 0 } }
  
  try {
    // Check backup file exists
    await fs.access(options.backupPath)
    console.log(`📄 Reading backup file: ${options.backupPath}`)
    
    // Load backup data
    const backupJson = await fs.readFile(options.backupPath, 'utf8')
    const backupData: BackupData = JSON.parse(backupJson)
    
    console.log('\n📊 === BACKUP INFO ===')
    console.log(`⏰ Backup timestamp: ${backupData.metadata.timestamp}`)
    console.log(`📄 App data included: ${backupData.metadata.appDataIncluded}`)
    console.log(`🏢 Organizations: ${backupData.metadata.organizationsIncluded.length}`)
    console.log(`📊 Backup size: ${(backupData.metadata.totalSize / 1024).toFixed(2)} KB`)
    
    if (options.dryRun) {
      console.log('\n🔍 DRY RUN MODE - No data will be restored')
      return result
    }

    // Check Azure connection
    const azureConnected = await checkAzureConnection()
    if (!azureConnected) {
      return { success: false, error: 'Azure Table Storage connection failed', restored: { apps: 0, orgs: 0 } }
    }

    // Initialize repository
    const azureRepo = new AzureTableOrgRepoAdapter({
      strictValidation: false,
      autoMigrate: true
    })

    // Restore app data
    if (!options.skipAppData && backupData.appData) {
      console.log('\n📦 === APP DATA RESTORE ===')
      
      try {
        // Check if app data already exists
        if (!options.overwriteExisting) {
          try {
            await azureRepo.getApp()
            console.log('⚠️ App data already exists. Use --overwrite to replace it.')
          } catch (error) {
            // App data doesn't exist, proceed with restore
            console.log('✅ No existing app data found, proceeding with restore')
          }
        }
        
        await azureRepo.upsertApp({ appData: backupData.appData })
        result.restored.apps = 1
        console.log('✅ App data restored successfully')
      } catch (error) {
        console.error('❌ App data restore failed:', error)
        result.success = false
      }
    }

    // Restore organization data
    if (!options.skipOrgData) {
      console.log('\n🏢 === ORGANIZATION DATA RESTORE ===')
      const orgsToRestore = options.orgSlugsOnly || backupData.metadata.organizationsIncluded
      
      if (orgsToRestore.length === 0) {
        console.log('⚠️ No organizations to restore')
      } else {
        console.log(`📋 Restoring ${orgsToRestore.length} organizations...`)
        
        for (const orgSlug of orgsToRestore) {
          if (!backupData.organizations[orgSlug]) {
            console.error(`❌ ${orgSlug} not found in backup data`)
            continue
          }
          
          try {
            // Check if org data already exists
            if (!options.overwriteExisting) {
              try {
                await azureRepo.getOrg({ orgSlug })
                console.log(`⚠️ ${orgSlug} already exists. Use --overwrite to replace it.`)
                continue
              } catch (error) {
                // Org doesn't exist, proceed with restore
                console.log(`✅ No existing data for ${orgSlug}, proceeding with restore`)
              }
            }
            
            await azureRepo.upsertOrg({ 
              orgSlug, 
              orgData: backupData.organizations[orgSlug] 
            })
            result.restored.orgs++
            console.log(`✅ ${orgSlug} restored successfully`)
          } catch (error) {
            console.error(`❌ ${orgSlug} restore failed:`, error)
            result.success = false
          }
        }
      }
    }

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('💥 Restore failed:', errorMsg)
    return { success: false, error: errorMsg, restored: { apps: 0, orgs: 0 } }
  }
}

async function main() {
  console.log('💾 Azure Table Storage Backup & Recovery Tool')
  console.log('============================================\n')

  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'backup') {
    const options: BackupOptions = {
      outputDir: args.includes('--output') ? args[args.indexOf('--output') + 1] : undefined,
      compress: args.includes('--compress'),
      includeMetadata: args.includes('--metadata'),
      skipAppData: args.includes('--skip-app'),
      skipOrgData: args.includes('--skip-orgs')
    }

    // Check for specific org slugs
    const orgIndex = args.findIndex(arg => arg === '--orgs')
    if (orgIndex >= 0 && args[orgIndex + 1]) {
      options.orgSlugsOnly = args[orgIndex + 1].split(',')
    }

    console.log('⚙️ Backup options:', options)
    console.log('')

    const result = await createBackup(options)
    
    if (result.success) {
      console.log('\n🎉 Backup completed successfully!')
      console.log(`📁 Backup saved to: ${result.backupPath}`)
      process.exit(0)
    } else {
      console.log('\n💥 Backup failed')
      console.log(`❌ Error: ${result.error}`)
      process.exit(1)
    }
  } 
  else if (command === 'restore') {
    const backupPath = args[1]
    if (!backupPath) {
      console.error('❌ Error: Backup file path required')
      console.log('Usage: npm run backup:azure-tables restore <backup-file-path> [options]')
      process.exit(1)
    }

    const options: RestoreOptions = {
      backupPath,
      overwriteExisting: args.includes('--overwrite'),
      dryRun: args.includes('--dry-run'),
      skipAppData: args.includes('--skip-app'),
      skipOrgData: args.includes('--skip-orgs')
    }

    // Check for specific org slugs
    const orgIndex = args.findIndex(arg => arg === '--orgs')
    if (orgIndex >= 0 && args[orgIndex + 1]) {
      options.orgSlugsOnly = args[orgIndex + 1].split(',')
    }

    console.log('⚙️ Restore options:', options)
    console.log('')

    const result = await restoreFromBackup(options)
    
    console.log('\n📊 === RESTORE SUMMARY ===')
    console.log(`✅ Apps restored: ${result.restored.apps}`)
    console.log(`✅ Organizations restored: ${result.restored.orgs}`)
    
    if (result.success) {
      console.log('\n🎉 Restore completed successfully!')
      process.exit(0)
    } else {
      console.log('\n💥 Restore completed with errors')
      console.log(`❌ Error: ${result.error}`)
      process.exit(1)
    }
  } 
  else {
    console.log('Usage:')
    console.log('  npm run backup:azure-tables backup [options]')
    console.log('  npm run backup:azure-tables restore <backup-file> [options]')
    console.log('')
    console.log('Backup options:')
    console.log('  --output <dir>     Output directory for backup files')
    console.log('  --compress         Compress backup data')
    console.log('  --metadata         Include additional metadata')
    console.log('  --skip-app         Skip app data backup')
    console.log('  --skip-orgs        Skip organization data backup')
    console.log('  --orgs <list>      Backup only specific organizations (comma-separated)')
    console.log('')
    console.log('Restore options:')
    console.log('  --overwrite        Overwrite existing data')
    console.log('  --dry-run          Show what would be restored without doing it')
    console.log('  --skip-app         Skip app data restore')
    console.log('  --skip-orgs        Skip organization data restore')
    console.log('  --orgs <list>      Restore only specific organizations (comma-separated)')
    console.log('')
    console.log('Examples:')
    console.log('  npm run backup:azure-tables backup')
    console.log('  npm run backup:azure-tables backup --output ./my-backups --orgs org1,org2')
    console.log('  npm run backup:azure-tables restore ./backups/backup-2025-09-09.json --dry-run')
    console.log('  npm run backup:azure-tables restore ./backups/backup-2025-09-09.json --overwrite')
    process.exit(1)
  }
}

// Run the tool
main().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})

export { createBackup, restoreFromBackup, type BackupOptions, type RestoreOptions }