const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Persistent Storage Configuration - Tối ưu hóa cho User Data
const PERSISTENT_CONFIG = {
  // Local storage paths
  localDataDir: './data',
  localBackupDir: './data/backups',
  manualBackupDir: './manual_backups',
  
  // Chỉ backup User Data
  dataFiles: ['users.json'],
  
  // Auto-backup settings
  autoBackupInterval: 10 * 60 * 1000, // 10 phút
  maxLocalBackups: 20, // Giữ 20 backup gần nhất
  backupTimeout: 15000 // 15 giây timeout
};

class PersistentStorage {
  constructor() {
    this.backupTimer = null;
    this.lastBackupTime = 0;
    this.backupInProgress = false;
    this.ensureDirectories();
  }

  // Tạo thư mục cần thiết
  ensureDirectories() {
    const dirs = [
      PERSISTENT_CONFIG.localDataDir,
      PERSISTENT_CONFIG.localBackupDir,
      PERSISTENT_CONFIG.manualBackupDir
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[PERSISTENT] Created directory: ${dir}`);
      }
    });
  }

  // Tạo backup ID duy nhất
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = crypto.randomBytes(4).toString('hex');
    return `backup_${timestamp}_${randomId}`;
  }

  // Tạo backup User Data
  async createUserDataBackup() {
    const backupId = this.generateBackupId();
    const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      let successCount = 0;
      const backupResults = [];
      
      // Chỉ backup users.json
      const sourcePath = path.join(PERSISTENT_CONFIG.localDataDir, 'users.json');
      const destPath = path.join(backupPath, 'users.json');
      
      if (fs.existsSync(sourcePath)) {
        try {
          // Đọc và validate data trước khi backup
          const userData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          
          // Validate và clean data
          const cleanedData = this.validateAndCleanUserData(userData);
          
          // Backup data đã được clean
          fs.writeFileSync(destPath, JSON.stringify(cleanedData, null, 2));
          successCount++;
          backupResults.push(`✅ users.json (${Object.keys(cleanedData).length} users)`);
          
          console.log(`[PERSISTENT] User data validated and backed up: ${Object.keys(cleanedData).length} users`);
        } catch (error) {
          console.error(`[PERSISTENT] Error backing up users.json:`, error.message);
          backupResults.push(`❌ users.json (${error.message})`);
        }
      } else {
        console.log('[PERSISTENT] users.json not found, creating empty backup');
        fs.writeFileSync(destPath, JSON.stringify({}, null, 2));
        successCount++;
        backupResults.push(`✅ users.json (empty)`);
      }
      
      // Tạo metadata
      const metadata = {
        id: backupId,
        createdAt: new Date().toISOString(),
        type: 'user_data_backup',
        files: backupResults,
        successCount,
        totalFiles: PERSISTENT_CONFIG.dataFiles.length,
        userCount: successCount > 0 ? this.getUserCountFromBackup(backupPath) : 0,
        version: '2.0.0'
      };
      
      const metadataPath = path.join(backupPath, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`[PERSISTENT] User data backup created: ${backupId} (${successCount}/${PERSISTENT_CONFIG.dataFiles.length} files)`);
      
      // Cleanup old backups
      this.cleanupOldBackups();
      
      return {
        success: true,
        backupId,
        successCount,
        totalFiles: PERSISTENT_CONFIG.dataFiles.length,
        userCount: metadata.userCount,
        results: backupResults
      };
      
    } catch (error) {
      console.error('[PERSISTENT] Error creating user data backup:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate và clean user data
  validateAndCleanUserData(userData) {
    const cleanedData = {};
    const defaultUserData = {
      cartridge: 0,
      voiceTime: 0,
      totalVoice: 0,
      lastClaim: 0
    };

    for (const [userId, user] of Object.entries(userData)) {
      if (userId && typeof userId === 'string') {
        cleanedData[userId] = {
          ...defaultUserData,
          ...user
        };

        // Validate data types
        if (typeof cleanedData[userId].cartridge !== 'number' || cleanedData[userId].cartridge < 0) {
          cleanedData[userId].cartridge = 0;
        }
        if (typeof cleanedData[userId].voiceTime !== 'number' || cleanedData[userId].voiceTime < 0) {
          cleanedData[userId].voiceTime = 0;
        }
        if (typeof cleanedData[userId].totalVoice !== 'number' || cleanedData[userId].totalVoice < 0) {
          cleanedData[userId].totalVoice = 0;
        }
        if (typeof cleanedData[userId].lastClaim !== 'number' || cleanedData[userId].lastClaim < 0) {
          cleanedData[userId].lastClaim = 0;
        }
      }
    }

    return cleanedData;
  }

  // Lấy số lượng user từ backup
  getUserCountFromBackup(backupPath) {
    try {
      const userDataPath = path.join(backupPath, 'users.json');
      if (fs.existsSync(userDataPath)) {
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        return Object.keys(userData).length;
      }
    } catch (error) {
      console.error('[PERSISTENT] Error getting user count:', error.message);
    }
    return 0;
  }

  // Cleanup old backups
  cleanupOldBackups() {
    try {
      const backups = this.getAvailableBackups();
      if (backups.length > PERSISTENT_CONFIG.maxLocalBackups) {
        const backupsToDelete = backups.slice(PERSISTENT_CONFIG.maxLocalBackups);
        backupsToDelete.forEach(backup => {
          try {
            fs.rmSync(backup.path, { recursive: true, force: true });
            console.log(`[PERSISTENT] Deleted old backup: ${backup.id}`);
          } catch (error) {
            console.error(`[PERSISTENT] Error deleting backup ${backup.id}:`, error.message);
          }
        });
      }
    } catch (error) {
      console.error('[PERSISTENT] Error cleaning up old backups:', error.message);
    }
  }

  // Restore từ manual backup
  async restoreFromManualBackup(backupName) {
    try {
      console.log(`[PERSISTENT] Attempting to restore from manual backup: ${backupName}`);
      
      const manualBackupPath = path.join(PERSISTENT_CONFIG.manualBackupDir, backupName);
      if (!fs.existsSync(manualBackupPath)) {
        throw new Error(`Manual backup '${backupName}' not found`);
      }

      // Kiểm tra xem có phải là thư mục không
      const stats = fs.statSync(manualBackupPath);
      if (!stats.isDirectory()) {
        throw new Error(`'${backupName}' is not a directory`);
      }

      // Tìm file users.json trong manual backup
      const userDataPath = path.join(manualBackupPath, 'users.json');
      if (!fs.existsSync(userDataPath)) {
        throw new Error(`users.json not found in manual backup '${backupName}'`);
      }

      // Đọc và validate data từ manual backup
      const backupUserData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
      const validatedData = this.validateAndCleanUserData(backupUserData);

      // Tạo backup hiện tại trước khi restore
      console.log('[PERSISTENT] Creating backup of current data before restore...');
      await this.createUserDataBackup();

      // Restore data
      const currentUserDataPath = path.join(PERSISTENT_CONFIG.localDataDir, 'users.json');
      fs.writeFileSync(currentUserDataPath, JSON.stringify(validatedData, null, 2));

      console.log(`[PERSISTENT] Restore completed: ${Object.keys(validatedData).length} users restored`);
      return {
        success: true,
        userCount: Object.keys(validatedData).length,
        backupName: backupName
      };

    } catch (error) {
      console.error('[PERSISTENT] Manual backup restore failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Restore từ local backup
  async restoreFromLocalBackup(backupId = null) {
    try {
      console.log('[PERSISTENT] Attempting to restore from local backup...');
      
      // Nếu không có backupId, sử dụng backup mới nhất
      if (!backupId) {
        const backups = this.getAvailableBackups();
        if (backups.length === 0) {
          throw new Error('No local backups available');
        }
        backupId = backups[0].id;
        console.log(`[PERSISTENT] Using latest backup: ${backupId}`);
      }

      const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Local backup '${backupId}' not found`);
      }

      const userDataPath = path.join(backupPath, 'users.json');
      if (!fs.existsSync(userDataPath)) {
        throw new Error(`users.json not found in backup '${backupId}'`);
      }

      // Đọc và validate data
      const backupUserData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
      const validatedData = this.validateAndCleanUserData(backupUserData);

      // Tạo backup hiện tại trước khi restore
      console.log('[PERSISTENT] Creating backup of current data before restore...');
      await this.createUserDataBackup();

      // Restore data
      const currentUserDataPath = path.join(PERSISTENT_CONFIG.localDataDir, 'users.json');
      fs.writeFileSync(currentUserDataPath, JSON.stringify(validatedData, null, 2));

      console.log(`[PERSISTENT] Local restore completed: ${Object.keys(validatedData).length} users restored`);
      return {
        success: true,
        userCount: Object.keys(validatedData).length,
        backupId: backupId
      };

    } catch (error) {
      console.error('[PERSISTENT] Local backup restore failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy danh sách manual backups
  getManualBackups() {
    try {
      const backups = [];
      if (fs.existsSync(PERSISTENT_CONFIG.manualBackupDir)) {
        const items = fs.readdirSync(PERSISTENT_CONFIG.manualBackupDir);
        
        for (const item of items) {
          const fullPath = path.join(PERSISTENT_CONFIG.manualBackupDir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            const userDataPath = path.join(fullPath, 'users.json');
            if (fs.existsSync(userDataPath)) {
              try {
                const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
                const stats = fs.statSync(fullPath);
                backups.push({
                  name: item,
                  path: fullPath,
                  userCount: Object.keys(userData).length,
                  createdAt: stats.mtime,
                  time: stats.mtime.getTime()
                });
              } catch (error) {
                console.error(`[PERSISTENT] Error reading manual backup ${item}:`, error.message);
              }
            }
          }
        }
      }
      
      // Sắp xếp theo thời gian (mới nhất trước)
      return backups.sort((a, b) => b.time - a.time);
      
    } catch (error) {
      console.error('[PERSISTENT] Error getting manual backups:', error.message);
      return [];
    }
  }

  // Lấy danh sách local backups
  getAvailableBackups() {
    try {
      const backups = [];
      if (fs.existsSync(PERSISTENT_CONFIG.localBackupDir)) {
        const items = fs.readdirSync(PERSISTENT_CONFIG.localBackupDir);
        
        for (const item of items) {
          const fullPath = path.join(PERSISTENT_CONFIG.localBackupDir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            const metadataPath = path.join(fullPath, 'metadata.json');
            if (fs.existsSync(metadataPath)) {
              try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                backups.push({
                  id: item,
                  path: fullPath,
                  metadata: metadata,
                  time: new Date(metadata.createdAt).getTime()
                });
              } catch (error) {
                console.error(`[PERSISTENT] Error reading metadata for ${item}:`, error.message);
              }
            }
          }
        }
      }
      
      // Sắp xếp theo thời gian (mới nhất trước)
      return backups.sort((a, b) => b.time - a.time);
      
    } catch (error) {
      console.error('[PERSISTENT] Error getting available backups:', error.message);
      return [];
    }
  }

  // Bắt đầu auto-backup
  startAutoBackup() {
    console.log('[PERSISTENT] Starting auto-backup system...');
    
    // Backup đầu tiên
    this.createUserDataBackup();
    
    // Thiết lập interval
    this.backupTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastBackupTime > PERSISTENT_CONFIG.autoBackupInterval) {
        this.createUserDataBackup();
      }
    }, PERSISTENT_CONFIG.autoBackupInterval);
  }

  // Dừng auto-backup
  stopAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('[PERSISTENT] Auto-backup stopped');
    }
  }

  // Emergency backup
  async emergencyBackup() {
    console.log('[PERSISTENT] Creating emergency backup...');
    try {
      const result = await this.createUserDataBackup();
      if (result.success) {
        console.log('[PERSISTENT] Emergency backup created successfully');
      }
      return result;
    } catch (error) {
      console.error('[PERSISTENT] Emergency backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Thiết lập graceful shutdown
  setupGracefulShutdown() {
    const shutdownHandler = async () => {
      console.log('[PERSISTENT] Received shutdown signal, creating emergency backup...');
      await this.emergencyBackup();
      process.exit(0);
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    process.on('uncaughtException', async (error) => {
      console.error('[PERSISTENT] Uncaught exception:', error);
      await this.emergencyBackup();
      process.exit(1);
    });
  }

  // Lấy trạng thái hệ thống
  getSystemStatus() {
    const localBackups = this.getAvailableBackups();
    const manualBackups = this.getManualBackups();
    
    return {
      autoBackupEnabled: this.backupTimer !== null,
      lastBackupTime: this.lastBackupTime,
      localBackupCount: localBackups.length,
      manualBackupCount: manualBackups.length,
      latestLocalBackup: localBackups.length > 0 ? localBackups[0].id : null,
      latestManualBackup: manualBackups.length > 0 ? manualBackups[0].name : null,
      autoBackupInterval: PERSISTENT_CONFIG.autoBackupInterval,
      maxLocalBackups: PERSISTENT_CONFIG.maxLocalBackups
    };
  }

  // Load backup từ local sang manual
  async loadBackupToManual(backupId, manualName = null) {
    try {
      console.log(`[PERSISTENT] Loading backup ${backupId} to manual backup...`);
      
      // Kiểm tra backup có tồn tại không
      const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Local backup '${backupId}' not found`);
      }

      const userDataPath = path.join(backupPath, 'users.json');
      if (!fs.existsSync(userDataPath)) {
        throw new Error(`users.json not found in backup '${backupId}'`);
      }

      // Đọc data từ backup
      const backupUserData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
      const validatedData = this.validateAndCleanUserData(backupUserData);

      // Tạo tên manual backup
      let finalManualName = manualName;
      if (!finalManualName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        finalManualName = `manual_${backupId}_${timestamp}`;
      }

      // Tạo thư mục manual backup
      const manualBackupPath = path.join(PERSISTENT_CONFIG.manualBackupDir, finalManualName);
      if (fs.existsSync(manualBackupPath)) {
        throw new Error(`Manual backup '${finalManualName}' already exists`);
      }

      fs.mkdirSync(manualBackupPath, { recursive: true });

      // Copy data sang manual backup
      const manualUserDataPath = path.join(manualBackupPath, 'users.json');
      fs.writeFileSync(manualUserDataPath, JSON.stringify(validatedData, null, 2));

      console.log(`[PERSISTENT] Loaded backup ${backupId} to manual backup ${finalManualName}`);
      
      return {
        success: true,
        userCount: Object.keys(validatedData).length,
        manualName: finalManualName,
        sourceBackupId: backupId
      };

    } catch (error) {
      console.error('[PERSISTENT] Load backup to manual failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Xóa manual backup
  async deleteManualBackup(backupName) {
    try {
      console.log(`[PERSISTENT] Deleting manual backup: ${backupName}`);
      
      const manualBackupPath = path.join(PERSISTENT_CONFIG.manualBackupDir, backupName);
      if (!fs.existsSync(manualBackupPath)) {
        throw new Error(`Manual backup '${backupName}' not found`);
      }

      // Đọc số lượng users trước khi xóa
      let userCount = 0;
      const userDataPath = path.join(manualBackupPath, 'users.json');
      if (fs.existsSync(userDataPath)) {
        try {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
          userCount = Object.keys(userData).length;
        } catch (error) {
          console.warn(`[PERSISTENT] Could not read user count from ${backupName}:`, error.message);
        }
      }

      // Xóa thư mục backup
      fs.rmSync(manualBackupPath, { recursive: true, force: true });

      console.log(`[PERSISTENT] Deleted manual backup: ${backupName}`);
      
      return {
        success: true,
        userCount: userCount,
        deletedBackupName: backupName
      };

    } catch (error) {
      console.error('[PERSISTENT] Delete manual backup failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PersistentStorage; 