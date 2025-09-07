# Seed Data Implementation

This document describes the seed data system implemented for the Vail Hunt app to prepopulate data for the splash screen.

## What Was Implemented

### 1. Seed Data Structure (`src/data/seed-data.json`)
- **Organization**: BHHS (Berkshire Hathaway HomeServices)
- **Event**: Vail Hunt Challenge  
- **Teams**: RED, BLUE, GREEN, PINK
- **App Settings**: Default location and event configuration
- **Sample Progress**: Demo progress data for teams RED and BLUE

### 2. Seed Service (`src/services/SeedService.ts`)
- **SeedService class**: Singleton service for managing seed data
- **seedInitialData()**: Seeds basic app settings 
- **seedSampleProgress()**: Seeds demo progress for specified teams
- **clearSeedData()**: Utility to clear all seeded data
- **getAvailableTeams()**: Returns available teams from seed data

### 3. App Integration (`src/App.jsx`)
- **Automatic seeding**: Seeds data during app initialization
- **Skip existing**: Only seeds if data doesn't already exist
- **Non-breaking**: App continues to work normally if seeding fails

### 4. Demo Utilities (`src/utils/seed-demo.js`)
- **Browser console tools**: Test seeding functionality manually
- **Progress visualization**: Show current seeded data
- **Team management**: Seed progress for specific teams

## How It Works

1. **App Startup**: When the app initializes, it automatically calls `seedInitialData()`
2. **Settings Population**: Seeds BHHS organization, Vail event, and team data
3. **Non-destructive**: Existing user data is preserved (`skipExisting: true`)
4. **Dual Storage**: Uses DualWriteService to save to both localStorage and server

## Data Structure

### App Settings
```json
{
  "location": "BHHS",
  "team": "",
  "event": "Vail", 
  "updatedAt": "2025-09-07T07:40:00.000Z"
}
```

### Teams Available
- **RED** (#DC2626)
- **BLUE** (#2563EB) 
- **GREEN** (#059669)
- **PINK** (#DB2777)

### Sample Progress (RED Team Example)
- ✅ BHHS Vail Office (completed)
- ✅ Covered Bridge (completed)
- 🔲 Community Gathering (in progress)

## Usage

### Automatic (Default)
The seeding happens automatically when the app starts. No manual intervention needed.

### Manual (Browser Console)
```javascript
// Seed basic data
await seedDemo.seedInitialData()

// Seed with sample progress for specific teams
await seedDemo.seedWithProgress(['RED', 'BLUE'])

// View current seeded data  
seedDemo.showSeededData()

// Clear all seeded data
await seedDemo.clearSeedData()
```

### Programmatic (In Code)
```javascript
import { seedInitialData, seedService } from './services/SeedService'

// Basic seeding
await seedInitialData({ skipExisting: true })

// Advanced seeding with progress
await seedService.seedAppData({
  skipExisting: false,
  seedProgress: true,
  teams: ['RED', 'BLUE']
})
```

## Benefits

1. **Instant Demo**: App has meaningful data immediately on first load
2. **Team Collaboration**: Multiple teams can see realistic progress
3. **Testing**: Easy to populate data for testing scenarios
4. **Splash Screen**: Rich data makes splash screen more engaging
5. **Non-intrusive**: Preserves existing user data

## Files Created/Modified

### New Files
- `src/data/seed-data.json` - Seed data definitions
- `src/services/SeedService.ts` - Seeding service implementation  
- `src/utils/seed-demo.js` - Browser console demo utilities
- `SEED_DATA_README.md` - This documentation

### Modified Files  
- `src/App.jsx` - Added seeding call to app initialization

The implementation is complete and ready for use. The app now automatically populates with BHHS organization, Vail event, and RED/BLUE/GREEN/PINK teams on startup!