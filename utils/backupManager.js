const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cấu hình backup
const BACKUP_CONFIG = {
  // Backup tự động
  autoBackupInterval: 5 * 60 * 1000, // 5 phút
  maxAutoBackups: 20, // Giữ 20 backup tự động
  
  // Backup thủ công
  manualBackupDir: './manual_backups',
  maxManualBackups: 50, // Giữ 50 backup thủ công
  
  // Cấu hình file
  dataDir: './data',
  backupDir: './data/backups',
  tempDir: './data/temp',
  
  // Files cần backup
  filesToBackup: [
    './data/users.json',
    './data/shop.json', 
    './data/emojis.json'
  ]
};

class BackupManager {
  constructor() {
    this.lastBackupTime = 0;
    this.ensureDirectories();
  }

  // Tạo thư mục cần thiết
  ensureDirectories() {
    const dirs = [
      BACKUP_CONFIG.dataDir,
      BACKUP_CONFIG.backupDir,
      BACKUP_CONFIG.tempDir,
      BACKUP_CONFIG.manualBackupDir
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[BACKUP] Created directory: ${dir}`);
      }
    });
  }

  // Tạo tên backup với timestamp
  generateBackupName(prefix = 'auto') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = crypto.randomBytes(4).toString('hex');
    return `${prefix}_backup_${timestamp}_${randomId}`;
  }

  // Kiểm tra file có hợp lệ không
  isValidFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Kiểm tra cấu trúc dữ liệu
      if (path.basename(filePath) === 'users.json') {
        return typeof data === 'object' && data !== null;
      }
      
      return typeof data === 'object' && data !== null;
    } catch (error) {
      return false;
    }
  }

  // Tạo backup tự động
  async createAutoBackup() {
    const now = Date.now();
    
    // Kiểm tra xem có cần tạo backup không
    if (now - this.lastBackupTime < BACKUP_CONFIG.autoBackupInterval) {
      return false;
    }

    console.log('[BACKUP] Creating automatic backup...');
    
    const backupName = this.generateBackupName('auto');
    const backupPath = path.join(BACKUP_CONFIG.backupDir, backupName);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      let successCount = 0;
      const backupResults = [];
      
      for (const filePath of BACKUP_CONFIG.filesToBackup) {
        if (this.isValidFile(filePath)) {
          try {
            const fileName = path.basename(filePath);
            const destPath = path.join(backupPath, fileName);
            
            fs.copyFileSync(filePath, destPath);
            successCount++;
            backupResults.push(`✅ ${fileName}`);
          } catch (error) {
            console.error(`[BACKUP] Error backing up ${filePath}:`, error.message);
            backupResults.push(`❌ ${path.basename(filePath)}`);
          }
        }
      }
      
      // Tạo metadata
      const metadata = {
        type: 'auto',
        createdAt: new Date().toISOString(),
        files: backupResults,
        successCount,
        totalFiles: BACKUP_CONFIG.filesToBackup.length
      };
      
      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      this.lastBackupTime = now;
      this.cleanupOldAutoBackups();
      
      console.log(`[BACKUP] Auto backup created: ${backupName} (${successCount}/${BACKUP_CONFIG.filesToBackup.length} files)`);
      return true;
      
    } catch (error) {
      console.error('[BACKUP] Error creating auto backup:', error.message);
      return false;
    }
  }

  // Tạo backup thủ công
  async createManualBackup(name = null) {
    const backupName = name || this.generateBackupName('manual');
    const backupPath = path.join(BACKUP_CONFIG.manualBackupDir, backupName);
    
    console.log(`[BACKUP] Creating manual backup: ${backupName}`);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      let successCount = 0;
      const backupResults = [];
      
      for (const filePath of BACKUP_CONFIG.filesToBackup) {
        if (this.isValidFile(filePath)) {
          try {
            const fileName = path.basename(filePath);
            const destPath = path.join(backupPath, fileName);
            
            fs.copyFileSync(filePath, destPath);
            successCount++;
            backupResults.push(`✅ ${fileName}`);
          } catch (error) {
            console.error(`[BACKUP] Error backing up ${filePath}:`, error.message);
            backupResults.push(`❌ ${path.basename(filePath)}`);
          }
        }
      }
      
      // Tạo metadata
      const metadata = {
        type: 'manual',
        name: backupName,
        createdAt: new Date().toISOString(),
        files: backupResults,
        successCount,
        totalFiles: BACKUP_CONFIG.filesToBackup.length
      };
      
      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      this.cleanupOldManualBackups();
      
      console.log(`[BACKUP] Manual backup created: ${backupName} (${successCount}/${BACKUP_CONFIG.filesToBackup.length} files)`);
      return { success: true, name: backupName, successCount };
      
    } catch (error) {
      console.error('[BACKUP] Error creating manual backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Dọn dẹp backup tự động cũ
  cleanupOldAutoBackups() {
    try {
      const backupFiles = fs.readdirSync(BACKUP_CONFIG.backupDir)
        .filter(item => {
          const fullPath = path.join(BACKUP_CONFIG.backupDir, item);
          return fs.statSync(fullPath).isDirectory() && item.startsWith('auto_backup_');
        })
        .map(item => ({
          name: item,
          path: path.join(BACKUP_CONFIG.backupDir, item),
          time: fs.statSync(path.join(BACKUP_CONFIG.backupDir, item)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sắp xếp theo thời gian mới nhất
      
      // Xóa các backup cũ
      if (backupFiles.length > BACKUP_CONFIG.maxAutoBackups) {
        const filesToDelete = backupFiles.slice(BACKUP_CONFIG.maxAutoBackups);
        
        for (const file of filesToDelete) {
          fs.rmSync(file.path, { recursive: true, force: true });
          console.log(`[BACKUP] Deleted old auto backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('[BACKUP] Error cleaning up old auto backups:', error.message);
    }
  }

  // Dọn dẹp backup thủ công cũ
  cleanupOldManualBackups() {
    try {
      const backupFiles = fs.readdirSync(BACKUP_CONFIG.manualBackupDir)
        .filter(item => {
          const fullPath = path.join(BACKUP_CONFIG.manualBackupDir, item);
          return fs.statSync(fullPath).isDirectory() && item.startsWith('manual_backup_');
        })
        .map(item => ({
          name: item,
          path: path.join(BACKUP_CONFIG.manualBackupDir, item),
          time: fs.statSync(path.join(BACKUP_CONFIG.manualBackupDir, item)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sắp xếp theo thời gian mới nhất
      
      // Xóa các backup cũ
      if (backupFiles.length > BACKUP_CONFIG.maxManualBackups) {
        const filesToDelete = backupFiles.slice(BACKUP_CONFIG.maxManualBackups);
        
        for (const file of filesToDelete) {
          fs.rmSync(file.path, { recursive: true, force: true });
          console.log(`[BACKUP] Deleted old manual backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('[BACKUP] Error cleaning up old manual backups:', error.message);
    }
  }

  // Lấy danh sách backup
  getBackupList() {
    const autoBackups = [];
    const manualBackups = [];
    
    try {
      // Lấy backup tự động
      if (fs.existsSync(BACKUP_CONFIG.backupDir)) {
        const autoItems = fs.readdirSync(BACKUP_CONFIG.backupDir)
          .filter(item => {
            const fullPath = path.join(BACKUP_CONFIG.backupDir, item);
            return fs.statSync(fullPath).isDirectory() && item.startsWith('auto_backup_');
          })
          .map(item => {
            const fullPath = path.join(BACKUP_CONFIG.backupDir, item);
            const stat = fs.statSync(fullPath);
            return {
              name: item,
              path: fullPath,
              time: stat.mtime,
              type: 'auto'
            };
          })
          .sort((a, b) => b.time - a.time);
        
        autoBackups.push(...autoItems);
      }
      
      // Lấy backup thủ công
      if (fs.existsSync(BACKUP_CONFIG.manualBackupDir)) {
        const manualItems = fs.readdirSync(BACKUP_CONFIG.manualBackupDir)
          .filter(item => {
            const fullPath = path.join(BACKUP_CONFIG.manualBackupDir, item);
            return fs.statSync(fullPath).isDirectory() && item.startsWith('manual_backup_');
          })
          .map(item => {
            const fullPath = path.join(BACKUP_CONFIG.manualBackupDir, item);
            const stat = fs.statSync(fullPath);
            return {
              name: item,
              path: fullPath,
              time: stat.mtime,
              type: 'manual'
            };
          })
          .sort((a, b) => b.time - a.time);
        
        manualBackups.push(...manualItems);
      }
      
    } catch (error) {
      console.error('[BACKUP] Error getting backup list:', error.message);
    }
    
    return { autoBackups, manualBackups };
  }

  // Khôi phục từ backup
  async restoreFromBackup(backupName, backupType = 'manual') {
    const backupDir = backupType === 'manual' ? BACKUP_CONFIG.manualBackupDir : BACKUP_CONFIG.backupDir;
    const backupPath = path.join(backupDir, backupName);
    
    console.log(`[BACKUP] Restoring from ${backupType} backup: ${backupName}`);
    
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup ${backupName} not found`);
      }
      
      let successCount = 0;
      const restoreResults = [];
      
      for (const filePath of BACKUP_CONFIG.filesToBackup) {
        const fileName = path.basename(filePath);
        const sourcePath = path.join(backupPath, fileName);
        
        if (fs.existsSync(sourcePath)) {
          try {
            // Tạo backup của file hiện tại trước khi ghi đè
            if (fs.existsSync(filePath)) {
              const currentBackupName = `restore_backup_${Date.now()}.json`;
              const currentBackupPath = path.join(BACKUP_CONFIG.backupDir, currentBackupName);
              fs.copyFileSync(filePath, currentBackupPath);
              console.log(`[BACKUP] Created backup of current file: ${currentBackupName}`);
            }
            
            // Khôi phục file
            fs.copyFileSync(sourcePath, filePath);
            successCount++;
            restoreResults.push(`✅ ${fileName}`);
          } catch (error) {
            console.error(`[BACKUP] Error restoring ${fileName}:`, error.message);
            restoreResults.push(`❌ ${fileName}`);
          }
        } else {
          restoreResults.push(`⚠️ ${fileName} (not found in backup)`);
        }
      }
      
      console.log(`[BACKUP] Restore completed: ${successCount}/${BACKUP_CONFIG.filesToBackup.length} files`);
      return { success: true, successCount, results: restoreResults };
      
    } catch (error) {
      console.error('[BACKUP] Error restoring backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Bắt đầu backup tự động
  startAutoBackup() {
    console.log('[BACKUP] Starting auto backup system...');
    
    // Tạo backup đầu tiên
    this.createAutoBackup();
    
    // Thiết lập interval
    setInterval(() => {
      this.createAutoBackup();
    }, BACKUP_CONFIG.autoBackupInterval);
  }

  // Dừng backup tự động
  stopAutoBackup() {
    console.log('[BACKUP] Stopping auto backup system...');
    // Interval sẽ tự động dừng khi process kết thúc
  }
}

module.exports = BackupManager; 