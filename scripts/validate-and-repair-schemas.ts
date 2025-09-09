#!/usr/bin/env tsx

/**
 * Schema Validation and Repair Tool for Azure Table Storage
 * 
 * Validates and repairs data in Azure Table Storage against current schemas.
 * This tool helps ensure data integrity during migrations and upgrades.
 */

import { azureTableService } from '../src/services/AzureTableService'
import { AzureTableOrgRepoAdapter } from '../src/infra/storage/azure.table.adapter'
import { AppDataSchema } from '../src/types/appData.schemas'
import { OrgDataSchema } from '../src/types/orgData.schemas'
import type { AppData } from '../src/types/appData.schemas'
import type { OrgData } from '../src/types/orgData.schemas'

interface ValidationOptions {
  dryRun?: boolean
  repairErrors?: boolean
  validateOnly?: boolean
  orgSlugsOnly?: string[]
  skipAppData?: boolean
  skipOrgData?: boolean
}

interface ValidationResult {
  success: boolean
  appDataValid: boolean
  validOrgs: number
  invalidOrgs: number
  repairedOrgs: number
  errors: Array<{
    type: 'app' | 'org'
    slug?: string
    schemaVersion?: string
    errors: string[]
  }>
  warnings: Array<{
    type: 'app' | 'org'
    slug?: string
    message: string
  }>
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

async function validateAppData(
  azureRepo: AzureTableOrgRepoAdapter,
  options: ValidationOptions
): Promise<{ valid: boolean; errors: string[]; repaired: boolean }> {
  console.log('📦 Validating app data...')
  
  try {
    // Try to get app data
    const appResult = await azureRepo.getApp()
    const appData = appResult.data
    
    console.log(`📊 Found app data, schema version: ${appData.schemaVersion}`)
    console.log(`📊 Organizations: ${appData.organizations.length}`)
    console.log(`📊 Date index entries: ${Object.keys(appData.byDate || {}).length}`)
    
    // Validate against current schema
    try {
      const validationResult = AppDataSchema.safeParse(appData)
      
      if (validationResult.success) {
        console.log('✅ App data is valid against current schema')
        return { valid: true, errors: [], repaired: false }
      } else {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
        console.log('❌ App data validation failed:')
        errors.forEach(error => console.log(`  - ${error}`))
        
        if (options.repairErrors && !options.dryRun) {
          console.log('🔧 Attempting to repair app data...')
          
          // Try to migrate/fix the data
          try {
            const repairedData = await attemptAppDataRepair(appData)
            const repairValidation = AppDataSchema.safeParse(repairedData)
            
            if (repairValidation.success) {
              await azureRepo.upsertApp({ appData: repairedData })
              console.log('✅ App data repaired and saved successfully')
              return { valid: true, errors: [], repaired: true }
            } else {
              console.log('❌ App data repair failed, validation still failing')
              return { valid: false, errors, repaired: false }
            }
          } catch (repairError) {
            console.error('❌ App data repair failed:', repairError)
            return { valid: false, errors, repaired: false }
          }
        } else if (options.dryRun && options.repairErrors) {
          console.log('🔍 DRY RUN: Would attempt to repair app data')
        }
        
        return { valid: false, errors, repaired: false }
      }
    } catch (schemaError) {
      const error = `Schema validation error: ${schemaError}`
      console.error('❌', error)
      return { valid: false, errors: [error], repaired: false }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('⚠️ No app data found in Azure Tables')
      return { valid: true, errors: [], repaired: false } // Missing data is not invalid
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to validate app data:', errorMsg)
    return { valid: false, errors: [errorMsg], repaired: false }
  }
}

async function attemptAppDataRepair(appData: any): Promise<AppData> {
  console.log('🔧 Attempting app data repair...')
  
  // Common repair strategies
  const repairedData = { ...appData }
  
  // Ensure required fields exist
  if (!repairedData.schemaVersion) {
    repairedData.schemaVersion = '1.2.0'
    console.log('🔧 Added missing schemaVersion')
  }
  
  if (!repairedData.updatedAt) {
    repairedData.updatedAt = new Date().toISOString()
    console.log('🔧 Added missing updatedAt')
  }
  
  // Ensure app object structure
  if (!repairedData.app) {
    repairedData.app = {}
  }
  
  if (!repairedData.app.metadata) {
    repairedData.app.metadata = {
      name: 'Vail Love Hunt',
      environment: 'production'
    }
    console.log('🔧 Added missing app.metadata')
  }
  
  if (!repairedData.app.features) {
    repairedData.app.features = {
      enableKVEvents: false,
      enableBlobEvents: false,
      enablePhotoUpload: true,
      enableMapPage: false
    }
    console.log('🔧 Added missing app.features')
  }
  
  if (!repairedData.app.defaults) {
    repairedData.app.defaults = {
      timezone: 'America/Denver',
      locale: 'en-US'
    }
    console.log('🔧 Added missing app.defaults')
  }
  
  // Ensure organizations array
  if (!repairedData.organizations) {
    repairedData.organizations = []
    console.log('🔧 Added missing organizations array')
  }
  
  // Fix organization entries
  repairedData.organizations = repairedData.organizations.map((org: any) => ({
    orgSlug: org.orgSlug || org.slug || 'unknown',
    orgName: org.orgName || org.name || 'Unknown Organization',
    contactEmail: org.contactEmail || org.contact?.email || 'admin@example.com',
    status: org.status || 'active'
  }))
  
  return repairedData as AppData
}

async function validateOrgData(
  azureRepo: AzureTableOrgRepoAdapter,
  orgSlug: string,
  options: ValidationOptions
): Promise<{ valid: boolean; errors: string[]; repaired: boolean }> {
  console.log(`🏢 Validating organization: ${orgSlug}`)
  
  try {
    // Try to get org data
    const orgResult = await azureRepo.getOrg({ orgSlug })
    const orgData = orgResult.data
    
    console.log(`📊 Found org data for ${orgData.org.orgName}`)
    console.log(`📊 Schema version: ${orgData.schemaVersion}`)
    console.log(`📊 Hunts: ${orgData.hunts.length}`)
    console.log(`📊 Contacts: ${orgData.org.contacts.length}`)
    
    // Validate against current schema
    try {
      const validationResult = OrgDataSchema.safeParse(orgData)
      
      if (validationResult.success) {
        console.log(`✅ ${orgSlug} data is valid against current schema`)
        return { valid: true, errors: [], repaired: false }
      } else {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
        console.log(`❌ ${orgSlug} validation failed:`)
        errors.forEach(error => console.log(`  - ${error}`))
        
        if (options.repairErrors && !options.dryRun) {
          console.log(`🔧 Attempting to repair ${orgSlug} data...`)
          
          try {
            const repairedData = await attemptOrgDataRepair(orgData)
            const repairValidation = OrgDataSchema.safeParse(repairedData)
            
            if (repairValidation.success) {
              await azureRepo.upsertOrg({ orgSlug, orgData: repairedData })
              console.log(`✅ ${orgSlug} data repaired and saved successfully`)
              return { valid: true, errors: [], repaired: true }
            } else {
              console.log(`❌ ${orgSlug} repair failed, validation still failing`)
              return { valid: false, errors, repaired: false }
            }
          } catch (repairError) {
            console.error(`❌ ${orgSlug} repair failed:`, repairError)
            return { valid: false, errors, repaired: false }
          }
        } else if (options.dryRun && options.repairErrors) {
          console.log(`🔍 DRY RUN: Would attempt to repair ${orgSlug} data`)
        }
        
        return { valid: false, errors, repaired: false }
      }
    } catch (schemaError) {
      const error = `Schema validation error: ${schemaError}`
      console.error('❌', error)
      return { valid: false, errors: [error], repaired: false }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(`⚠️ Organization ${orgSlug} not found in Azure Tables`)
      return { valid: true, errors: [], repaired: false } // Missing data is not invalid
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ Failed to validate ${orgSlug}:`, errorMsg)
    return { valid: false, errors: [errorMsg], repaired: false }
  }
}

async function attemptOrgDataRepair(orgData: any): Promise<OrgData> {
  console.log('🔧 Attempting org data repair...')
  
  const repairedData = { ...orgData }
  
  // Ensure required fields exist
  if (!repairedData.schemaVersion) {
    repairedData.schemaVersion = '1.2.0'
    console.log('🔧 Added missing schemaVersion')
  }
  
  if (!repairedData.updatedAt) {
    repairedData.updatedAt = new Date().toISOString()
    console.log('🔧 Added missing updatedAt')
  }
  
  // Ensure org object structure
  if (!repairedData.org) {
    repairedData.org = {}
  }
  
  if (!repairedData.org.orgSlug) {
    repairedData.org.orgSlug = 'unknown-org'
    console.log('🔧 Added missing org.orgSlug')
  }
  
  if (!repairedData.org.orgName) {
    repairedData.org.orgName = 'Unknown Organization'
    console.log('🔧 Added missing org.orgName')
  }
  
  if (!repairedData.org.contacts) {
    repairedData.org.contacts = [{
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin'
    }]
    console.log('🔧 Added missing org.contacts')
  }
  
  if (!repairedData.org.settings) {
    repairedData.org.settings = {
      timezone: 'America/Denver',
      locale: 'en-US',
      theme: 'default'
    }
    console.log('🔧 Added missing org.settings')
  }
  
  // Ensure hunts array
  if (!repairedData.hunts) {
    repairedData.hunts = []
    console.log('🔧 Added missing hunts array')
  }
  
  return repairedData as OrgData
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

async function runValidation(options: ValidationOptions = {}): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    appDataValid: true,
    validOrgs: 0,
    invalidOrgs: 0,
    repairedOrgs: 0,
    errors: [],
    warnings: []
  }

  console.log('🔍 Starting Azure Table Storage Schema Validation')
  console.log('================================================')
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be modified')
  }
  
  try {
    // Check connection
    const azureConnected = await checkAzureConnection()
    if (!azureConnected) {
      result.errors.push({
        type: 'app',
        errors: ['Azure Table Storage connection failed']
      })
      result.success = false
      return result
    }

    // Initialize repository
    const azureRepo = new AzureTableOrgRepoAdapter({
      strictValidation: false,
      autoMigrate: false
    })

    // Validate app data
    if (!options.skipAppData) {
      console.log('\n📦 === APP DATA VALIDATION ===')
      const appValidation = await validateAppData(azureRepo, options)
      result.appDataValid = appValidation.valid
      
      if (!appValidation.valid) {
        result.errors.push({
          type: 'app',
          errors: appValidation.errors
        })
        result.success = false
      }
    }

    // Validate organization data
    if (!options.skipOrgData) {
      console.log('\n🏢 === ORGANIZATION DATA VALIDATION ===')
      const orgSlugs = options.orgSlugsOnly || await discoverOrganizations(azureRepo)
      
      if (orgSlugs.length === 0) {
        console.log('⚠️ No organizations found to validate')
      } else {
        console.log(`📋 Validating ${orgSlugs.length} organizations...`)
        
        for (const orgSlug of orgSlugs) {
          const orgValidation = await validateOrgData(azureRepo, orgSlug, options)
          
          if (orgValidation.valid) {
            result.validOrgs++
            if (orgValidation.repaired) {
              result.repairedOrgs++
            }
          } else {
            result.invalidOrgs++
            result.errors.push({
              type: 'org',
              slug: orgSlug,
              errors: orgValidation.errors
            })
            result.success = false
          }
        }
      }
    }

    return result
  } catch (error) {
    result.errors.push({
      type: 'app',
      errors: [error instanceof Error ? error.message : String(error)]
    })
    result.success = false
    return result
  }
}

async function main() {
  console.log('🔍 Azure Table Storage Schema Validation Tool')
  console.log('=============================================\n')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const options: ValidationOptions = {
    dryRun: args.includes('--dry-run'),
    repairErrors: args.includes('--repair'),
    validateOnly: args.includes('--validate-only'),
    skipAppData: args.includes('--skip-app'),
    skipOrgData: args.includes('--skip-orgs')
  }

  // Check for specific org slugs
  const orgIndex = args.findIndex(arg => arg === '--orgs')
  if (orgIndex >= 0 && args[orgIndex + 1]) {
    options.orgSlugsOnly = args[orgIndex + 1].split(',')
  }

  console.log('⚙️ Validation options:', options)
  console.log('')

  try {
    const result = await runValidation(options)
    
    console.log('\n📊 === VALIDATION SUMMARY ===')
    console.log(`✅ App data valid: ${result.appDataValid}`)
    console.log(`✅ Valid organizations: ${result.validOrgs}`)
    console.log(`❌ Invalid organizations: ${result.invalidOrgs}`)
    console.log(`🔧 Repaired organizations: ${result.repairedOrgs}`)
    console.log(`❌ Total errors: ${result.errors.length}`)
    console.log(`⚠️ Total warnings: ${result.warnings.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ VALIDATION ERRORS:')
      result.errors.forEach(error => {
        console.log(`  ${error.type.toUpperCase()}${error.slug ? ` (${error.slug})` : ''}:`)
        error.errors.forEach(err => console.log(`    - ${err}`))
      })
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ VALIDATION WARNINGS:')
      result.warnings.forEach(warning => {
        console.log(`  ${warning.type.toUpperCase()}${warning.slug ? ` (${warning.slug})` : ''}: ${warning.message}`)
      })
    }
    
    const success = result.success
    console.log(`\n${success ? '🎉 All data validated successfully!' : '💥 Validation completed with errors'}`)
    
    if (!success && options.validateOnly) {
      console.log('💡 Use --repair flag to attempt automatic repairs')
    }
    
    process.exit(success ? 0 : 1)
    
  } catch (error) {
    console.error('💥 Validation failed:', error)
    process.exit(1)
  }
}

// Run the validation
main().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})

export { runValidation, type ValidationOptions, type ValidationResult }