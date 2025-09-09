/**
 * Migration utilities index
 * Centralizes all data migration functions
 */

export { 
  migrateAppJson, 
  getDefaultAppJson 
} from './appJson.migrations'

export { 
  migrateOrgJson, 
  createMinimalOrgJson, 
  validateOrgJson 
} from './orgJson.migrations'

export { 
  CURRENT_APP_SCHEMA_VERSION 
} from '../../types/appData.schemas'

export { 
  CURRENT_ORG_SCHEMA_VERSION 
} from '../../types/orgData.schemas'