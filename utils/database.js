const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const errorLogger = require('./errorLogger');

// Database configuration
const DB_CONFIG = {
  backupInterval: 5 * 60 * 1000, // 5 minutes
  maxBackups: 10,
  autoSaveInterval: 30 * 1000, // 30 seconds
  dataDir: './data',
  backupDir: './data/backups',
  tempDir: './data/temp'
};

// In-memory cache for better performance
const memoryCache = new Map();
let lastBackupTime = 0;
let autoSaveTimer = null;

// Ensure directories exist
function ensureDirectories() {
  const dirs = [DB_CONFIG.dataDir, DB_CONFIG.backupDir, DB_CONFIG.tempDir];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate backup filename with timestamp
function generateBackupName(originalPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = path.basename(originalPath, '.json');
  return `${fileName}_backup_${timestamp}.json`;
}

// Atomic write with temporary file
function atomicWrite(filePath, data) {
  const tempPath = path.join(DB_CONFIG.tempDir, `temp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.json`);
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    
    // Verify the write was successful
    const writtenData = fs.readFileSync(tempPath, 'utf-8');
    const parsedData = JSON.parse(writtenData);
    
    // Compare data integrity
    if (JSON.stringify(parsedData) !== JSON.stringify(data)) {
      throw new Error('Data integrity check failed');
    }
    
    // Atomic move to final location
    fs.renameSync(tempPath, filePath);
    
    // Update cache
    memoryCache.set(filePath, data);
    
    return true;
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

// Create backup of a file
function createBackup(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  try {
    const backupName = generateBackupName(filePath);
    const backupPath = path.join(DB_CONFIG.backupDir, backupName);
    
    // Copy file to backup location
    fs.copyFileSync(filePath, backupPath);
    
    // Clean up old backups
    cleanupOldBackups(path.basename(filePath, '.json'));
    
    console.log(`[BACKUP] Created backup: ${backupName}`);
    errorLogger.logDatabaseOperation('backup_created', filePath, true);
    return backupPath;
  } catch (error) {
    console.error(`[BACKUP] Failed to create backup for ${filePath}:`, error);
    errorLogger.logDatabaseOperation('backup_failed', filePath, false, error);
    return null;
  }
}

// Clean up old backups
function cleanupOldBackups(filePrefix) {
  try {
    const backupFiles = fs.readdirSync(DB_CONFIG.backupDir)
      .filter(file => file.startsWith(filePrefix) && file.includes('_backup_'))
      .map(file => ({
        name: file,
        path: path.join(DB_CONFIG.backupDir, file),
        time: fs.statSync(path.join(DB_CONFIG.backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // Keep only the most recent backups
    if (backupFiles.length > DB_CONFIG.maxBackups) {
      const filesToDelete = backupFiles.slice(DB_CONFIG.maxBackups);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`[BACKUP] Deleted old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('[BACKUP] Failed to cleanup old backups:', error);
    errorLogger.logError(error, { context: 'cleanup_backups' });
  }
}

// Validate data structure
function validateUserData(data) {
  const requiredFields = ['cartridge', 'voiceTime', 'totalVoice', 'lastClaim'];
  const defaultValues = {
    cartridge: 0,
    voiceTime: 0,
    totalVoice: 0,
    lastClaim: 0,
    joinTime: null
  };
  
  // Ensure all required fields exist
  requiredFields.forEach(field => {
    if (typeof data[field] !== 'number') {
      data[field] = defaultValues[field];
    }
  });
  
  // Validate data ranges
  if (data.cartridge < 0) data.cartridge = 0;
  if (data.voiceTime < 0) data.voiceTime = 0;
  if (data.totalVoice < 0) data.totalVoice = 0;
  if (data.lastClaim < 0) data.lastClaim = 0;
  
  return data;
}

// Enhanced loadJSON with cache and validation
function loadJSON(filePath) {
  try {
    // Check cache first
    if (memoryCache.has(filePath)) {
      return memoryCache.get(filePath);
    }
    
    // Read from file
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    
    // Validate and fix data if needed
    if (filePath.includes('users.json')) {
      Object.keys(data).forEach(userId => {
        data[userId] = validateUserData(data[userId]);
      });
    }
    
    // Cache the data
    memoryCache.set(filePath, data);
    errorLogger.logDatabaseOperation('load_success', filePath, true);
    return data;
  } catch (err) {
    console.warn(`[DB] Failed to load ${filePath}, creating new file:`, err.message);
    errorLogger.logDatabaseOperation('load_failed', filePath, false, err);
    return {};
  }
}

// Enhanced saveJSON with atomic writes and backup
function saveJSON(filePath, data) {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Create backup if enough time has passed
    const now = Date.now();
    if (now - lastBackupTime > DB_CONFIG.backupInterval) {
      createBackup(filePath);
      lastBackupTime = now;
    }
    
    // Validate data before saving
    if (filePath.includes('users.json')) {
      Object.keys(data).forEach(userId => {
        data[userId] = validateUserData(data[userId]);
      });
    }
    
    // Atomic write
    atomicWrite(filePath, data);
    
    console.log(`[DB] Successfully saved ${filePath}`);
    errorLogger.logDatabaseOperation('save_success', filePath, true);
    return true;
  } catch (error) {
    console.error(`[DB] Failed to save ${filePath}:`, error);
    errorLogger.logDatabaseOperation('save_failed', filePath, false, error);
    
    // Try to recover from backup
    try {
      const backupFiles = fs.readdirSync(DB_CONFIG.backupDir)
        .filter(file => file.startsWith(path.basename(filePath, '.json')))
        .sort()
        .reverse();
      
      if (backupFiles.length > 0) {
        const latestBackup = path.join(DB_CONFIG.backupDir, backupFiles[0]);
        console.log(`[DB] Attempting to recover from backup: ${latestBackup}`);
        
        const backupData = loadJSON(latestBackup);
        atomicWrite(filePath, backupData);
        console.log(`[DB] Successfully recovered from backup`);
        errorLogger.logDatabaseOperation('recovery_success', filePath, true);
        return true;
      }
    } catch (recoveryError) {
      console.error(`[DB] Failed to recover from backup:`, recoveryError);
      errorLogger.logDatabaseOperation('recovery_failed', filePath, false, recoveryError);
    }
    
    return false;
  }
}

// Auto-save mechanism
function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  autoSaveTimer = setInterval(() => {
    try {
      // Save all cached data
      memoryCache.forEach((data, filePath) => {
        if (fs.existsSync(filePath)) {
          const currentData = loadJSON(filePath);
          if (JSON.stringify(currentData) !== JSON.stringify(data)) {
            saveJSON(filePath, data);
          }
        }
      });
    } catch (error) {
      console.error('[AUTO-SAVE] Error during auto-save:', error);
      errorLogger.logError(error, { context: 'auto_save' });
    }
  }, DB_CONFIG.autoSaveInterval);
  
  console.log('[DB] Auto-save started');
}

// Stop auto-save
function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('[DB] Auto-save stopped');
  }
}

// Force save all cached data
function forceSaveAll() {
  console.log('[DB] Force saving all cached data...');
  memoryCache.forEach((data, filePath) => {
    saveJSON(filePath, data);
  });
}

// Enhanced user management functions
function initUser(userId) {
  const users = loadJSON('./data/users.json');
  if (!users[userId]) {
    users[userId] = {
      cartridge: 0,
      voiceTime: 0,
      totalVoice: 0,
      lastClaim: 0,
      joinTime: Date.now()
    };
    saveJSON('./data/users.json', users);
  }
  return users[userId];
}

function getUserData(userId) {
  const users = loadJSON('./data/users.json');
  if (!users[userId]) {
    return initUser(userId);
  }
  return users[userId];
}

function updateUserData(userId, data) {
  const users = loadJSON('./data/users.json');
  users[userId] = { ...users[userId], ...data };
  saveJSON('./data/users.json', users);
}

// Enhanced voice time tracking with better error handling
const voiceTime = {
  data: new Map(),
  
  setJoin(userId, time) {
    this.data.set(userId, { joinTime: time });
  },
  
  get(userId) {
    return this.data.get(userId);
  },
  
  addTime(userId, timeSpent) {
    try {
      const users = loadJSON('./data/users.json');
      if (!users[userId]) {
        users[userId] = { 
          cartridge: 0, 
          voiceTime: 0, 
          totalVoice: 0, 
          lastClaim: 0,
          joinTime: Date.now()
        };
      }
      
      // Convert milliseconds to minutes for accurate tracking
      const timeInMinutes = Math.floor(timeSpent / 60000);
      
      // Only add time if it's reasonable (prevent huge jumps)
      if (timeInMinutes > 0 && timeInMinutes < 1440) { // Max 24 hours per session
        users[userId].voiceTime += timeInMinutes;
        users[userId].totalVoice += timeInMinutes;
        
        // Validate data before saving
        users[userId] = validateUserData(users[userId]);
        
        saveJSON('./data/users.json', users);
        console.log(`[VOICE] Added ${timeInMinutes} minutes for user ${userId}`);
      } else {
        console.warn(`[VOICE] Skipped adding ${timeInMinutes} minutes for user ${userId} (unreasonable time)`);
      }
    } catch (error) {
      console.error(`[VOICE] Error adding time for user ${userId}:`, error);
      errorLogger.logError(error, { 
        context: 'voice_time_add',
        userId: userId,
        timeSpent: timeSpent
      });
    }
  }
};

// Graceful shutdown handler
function setupGracefulShutdown() {
  process.on('SIGINT', () => {
    console.log('[DB] Received SIGINT, saving data...');
    forceSaveAll();
    stopAutoSave();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('[DB] Received SIGTERM, saving data...');
    forceSaveAll();
    stopAutoSave();
    process.exit(0);
  });
  
  process.on('uncaughtException', (error) => {
    console.error('[DB] Uncaught exception, saving data...', error);
    errorLogger.logError(error, { context: 'uncaught_exception' });
    forceSaveAll();
    stopAutoSave();
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[DB] Unhandled rejection, saving data...', reason);
    errorLogger.logError(reason, { context: 'unhandled_rejection' });
    forceSaveAll();
    stopAutoSave();
    process.exit(1);
  });
}

// Initialize database system
function initializeDatabase() {
  ensureDirectories();
  setupGracefulShutdown();
  startAutoSave();
  console.log('[DB] Database system initialized with enhanced features');
}

module.exports = { 
  loadJSON, 
  saveJSON, 
  initUser, 
  getUserData, 
  updateUserData,
  voiceTime,
  initializeDatabase,
  forceSaveAll,
  stopAutoSave,
  createBackup,
  DB_CONFIG
};
