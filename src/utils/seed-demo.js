/**
 * Demo script to test seeding functionality
 * This can be used in browser console to test seeding manually
 */

// Import the seed service (this would need to be called from within the app)
// import { seedService } from '../services/SeedService';

window.seedDemo = {
  // Seed initial data
  async seedInitialData() {
    try {
      const { seedInitialData } = await import('../services/SeedService');
      console.log('🌱 Starting seed process...');
      await seedInitialData({ skipExisting: false });
      console.log('✅ Seeding completed!');
      
      // Show what was seeded
      const settings = localStorage.getItem('app-settings');
      console.log('📱 App settings seeded:', JSON.parse(settings || '{}'));
      
      return { success: true, message: 'Data seeded successfully' };
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      return { success: false, error };
    }
  },

  // Seed with sample progress for demo teams
  async seedWithProgress(teams = ['RED', 'BLUE']) {
    try {
      const { seedService } = await import('../services/SeedService');
      console.log('🌱 Starting seed with progress for teams:', teams);
      
      await seedService.seedAppData({ 
        skipExisting: false, 
        seedProgress: true, 
        teams 
      });
      
      console.log('✅ Seeding with progress completed!');
      return { success: true, message: `Progress seeded for teams: ${teams.join(', ')}` };
    } catch (error) {
      console.error('❌ Seeding with progress failed:', error);
      return { success: false, error };
    }
  },

  // Clear all seeded data
  async clearSeedData() {
    try {
      const { seedService } = await import('../services/SeedService');
      console.log('🧹 Clearing all seeded data...');
      
      await seedService.clearSeedData();
      
      console.log('✅ All seeded data cleared!');
      return { success: true, message: 'All seeded data cleared' };
    } catch (error) {
      console.error('❌ Failed to clear seeded data:', error);
      return { success: false, error };
    }
  },

  // Show current seeded data
  showSeededData() {
    console.log('📋 Current seeded data in localStorage:');
    
    const appSettings = localStorage.getItem('app-settings');
    if (appSettings) {
      console.log('📱 App Settings:', JSON.parse(appSettings));
    } else {
      console.log('📱 App Settings: Not found');
    }

    // Check for progress data
    const teams = ['RED', 'BLUE', 'GREEN', 'PINK'];
    teams.forEach(team => {
      const progressKey = `progress:BHHS:Vail:${team}`;
      const progress = localStorage.getItem(progressKey);
      if (progress) {
        console.log(`🏃‍♀️ ${team} Progress:`, JSON.parse(progress));
      } else {
        console.log(`🏃‍♀️ ${team} Progress: Not found`);
      }
    });
  },

  // Show available teams
  getAvailableTeams() {
    const teams = ['RED', 'BLUE', 'GREEN', 'PINK'];
    console.log('🎯 Available teams for seeding:', teams);
    return teams;
  }
};

console.log('🌱 Seed Demo Utils loaded! Available commands:');
console.log('  seedDemo.seedInitialData() - Seed basic app settings');
console.log('  seedDemo.seedWithProgress([\"RED\", \"BLUE\"]) - Seed with sample progress');
console.log('  seedDemo.clearSeedData() - Clear all seeded data');
console.log('  seedDemo.showSeededData() - Show current seeded data');
console.log('  seedDemo.getAvailableTeams() - Show available teams');