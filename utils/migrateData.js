const fs = require('fs');
const path = require('path');
const { loadJSON, saveJSON, createBackup, DB_CONFIG } = require('./database');

// Migration script to upgrade existing data to new database system
function migrateData() {
  console.log('[MIGRATION] Starting data migration...');
  
  try {
    // Ensure directories exist
    const dirs = [DB_CONFIG.dataDir, DB_CONFIG.backupDir, DB_CONFIG.tempDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[MIGRATION] Created directory: ${dir}`);
      }
    });
    
    // Migrate users.json
    const usersPath = './data/users.json';
    if (fs.existsSync(usersPath)) {
      console.log('[MIGRATION] Migrating users.json...');
      
      // Create backup of original file
      const backupPath = path.join(DB_CONFIG.backupDir, `users_migration_backup_${Date.now()}.json`);
      fs.copyFileSync(usersPath, backupPath);
      console.log(`[MIGRATION] Created backup: ${backupPath}`);
      
      // Load and validate existing data
      const users = loadJSON(usersPath);
      let migratedCount = 0;
      
      Object.keys(users).forEach(userId => {
        const userData = users[userId];
        
        // Ensure all required fields exist
        if (typeof userData.cartridge !== 'number') userData.cartridge = 0;
        if (typeof userData.voiceTime !== 'number') userData.voiceTime = 0;
        if (typeof userData.totalVoice !== 'number') userData.totalVoice = 0;
        if (typeof userData.lastClaim !== 'number') userData.lastClaim = 0;
        if (!userData.joinTime) userData.joinTime = Date.now();
        
        // Validate data ranges
        if (userData.cartridge < 0) userData.cartridge = 0;
        if (userData.voiceTime < 0) userData.voiceTime = 0;
        if (userData.totalVoice < 0) userData.totalVoice = 0;
        if (userData.lastClaim < 0) userData.lastClaim = 0;
        
        migratedCount++;
      });
      
      // Save migrated data
      saveJSON(usersPath, users);
      console.log(`[MIGRATION] Migrated ${migratedCount} user records`);
    } else {
      console.log('[MIGRATION] users.json not found, will be created when needed');
    }
    
    // Migrate other JSON files
    const filesToMigrate = [
      './data/emojis.json',
      './data/shop.json'
    ];
    
    filesToMigrate.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        console.log(`[MIGRATION] Migrating ${filePath}...`);
        
        // Create backup
        const backupPath = path.join(DB_CONFIG.backupDir, `${path.basename(filePath, '.json')}_migration_backup_${Date.now()}.json`);
        fs.copyFileSync(filePath, backupPath);
        console.log(`[MIGRATION] Created backup: ${backupPath}`);
        
        // Load and save with new system
        const data = loadJSON(filePath);
        saveJSON(filePath, data);
        console.log(`[MIGRATION] Migrated ${filePath}`);
      }
    });
    
    // Create initial backups
    console.log('[MIGRATION] Creating initial backups...');
    const dataFiles = fs.readdirSync('./data').filter(file => file.endsWith('.json'));
    dataFiles.forEach(file => {
      const filePath = path.join('./data', file);
      createBackup(filePath);
    });
    
    console.log('[MIGRATION] Data migration completed successfully!');
    console.log('[MIGRATION] All existing data has been backed up and migrated to the new system.');
    
  } catch (error) {
    console.error('[MIGRATION] Error during migration:', error);
    throw error;
  }
}

// Function to verify migration
function verifyMigration() {
  console.log('[VERIFICATION] Verifying migration...');
  
  try {
    const usersPath = './data/users.json';
    if (fs.existsSync(usersPath)) {
      const users = loadJSON(usersPath);
      let validCount = 0;
      let invalidCount = 0;
      
      Object.keys(users).forEach(userId => {
        const userData = users[userId];
        const isValid = (
          typeof userData.cartridge === 'number' &&
          typeof userData.voiceTime === 'number' &&
          typeof userData.totalVoice === 'number' &&
          typeof userData.lastClaim === 'number' &&
          userData.cartridge >= 0 &&
          userData.voiceTime >= 0 &&
          userData.totalVoice >= 0 &&
          userData.lastClaim >= 0
        );
        
        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
          console.warn(`[VERIFICATION] Invalid user data for ${userId}:`, userData);
        }
      });
      
      console.log(`[VERIFICATION] Valid records: ${validCount}`);
      console.log(`[VERIFICATION] Invalid records: ${invalidCount}`);
      
      if (invalidCount === 0) {
        console.log('[VERIFICATION] All user data is valid!');
      } else {
        console.warn('[VERIFICATION] Some user data needs attention.');
      }
    }
    
    // Check backup directory
    if (fs.existsSync(DB_CONFIG.backupDir)) {
      const backupFiles = fs.readdirSync(DB_CONFIG.backupDir);
      console.log(`[VERIFICATION] Found ${backupFiles.length} backup files`);
    }
    
    console.log('[VERIFICATION] Migration verification completed!');
    
  } catch (error) {
    console.error('[VERIFICATION] Error during verification:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  console.log('[MIGRATION] Starting data migration process...');
  
  try {
    migrateData();
    verifyMigration();
    console.log('[MIGRATION] Migration process completed successfully!');
  } catch (error) {
    console.error('[MIGRATION] Migration failed:', error);
    process.exit(1);
  }
}

module.exports = {
  migrateData,
  verifyMigration
}; 