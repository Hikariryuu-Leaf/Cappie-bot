const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Persistent Storage Configuration
const PERSISTENT_CONFIG = {
  // Local storage paths
  localDataDir: './data',
  localBackupDir: './data/backups',
  localManualBackupDir: './manual_backups',
  
  // External storage options (for Render)
  externalStorage: {
    // GitHub as backup storage
    github: {
      enabled: true, // Enable GitHub sync
      repo: process.env.GITHUB_REPO,
      token: process.env.GITHUB_TOKEN,
      branch: 'data-backup'
    },
    
    // Cloud storage options
    cloud: {
      enabled: false,
      provider: 'gdrive', // or 'dropbox', 'onedrive'
      credentials: process.env.CLOUD_CREDENTIALS
    }
  },
  
  // Auto-sync settings
  autoSyncInterval: 5 * 60 * 1000, // 5 minutes
  maxSyncRetries: 3,
  syncTimeout: 30000 // 30 seconds
};

class PersistentStorage {
  constructor() {
    this.syncTimer = null;
    this.lastSyncTime = 0;
    this.syncInProgress = false;
    this.ensureDirectories();
  }

  // Ensure all directories exist
  ensureDirectories() {
    const dirs = [
      PERSISTENT_CONFIG.localDataDir,
      PERSISTENT_CONFIG.localBackupDir,
      PERSISTENT_CONFIG.localManualBackupDir
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[PERSISTENT] Created directory: ${dir}`);
      }
    });
  }

  // Generate unique backup ID
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = crypto.randomBytes(4).toString('hex');
    return `backup_${timestamp}_${randomId}`;
  }

  // Create comprehensive backup
  async createComprehensiveBackup() {
    const backupId = this.generateBackupId();
    const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Backup all data files
      const dataFiles = [
        'users.json',
        'shop.json', 
        'emojis.json'
      ];
      
      let successCount = 0;
      const backupResults = [];
      
      for (const file of dataFiles) {
        const sourcePath = path.join(PERSISTENT_CONFIG.localDataDir, file);
        if (fs.existsSync(sourcePath)) {
          try {
            const destPath = path.join(backupPath, file);
            fs.copyFileSync(sourcePath, destPath);
            successCount++;
            backupResults.push(`✅ ${file}`);
          } catch (error) {
            console.error(`[PERSISTENT] Error backing up ${file}:`, error.message);
            backupResults.push(`❌ ${file}`);
          }
        }
      }
      
      // Create metadata
      const metadata = {
        id: backupId,
        createdAt: new Date().toISOString(),
        files: backupResults,
        successCount,
        totalFiles: dataFiles.length,
        version: '1.0.0'
      };
      
      const metadataPath = path.join(backupPath, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`[PERSISTENT] Comprehensive backup created: ${backupId} (${successCount}/${dataFiles.length} files)`);
      
      return {
        success: true,
        backupId,
        successCount,
        totalFiles: dataFiles.length,
        results: backupResults
      };
      
    } catch (error) {
      console.error('[PERSISTENT] Error creating comprehensive backup:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate GitHub configuration
  async validateGitHubConfig() {
    try {
      console.log('[PERSISTENT] Validating GitHub configuration...');
      
      if (!PERSISTENT_CONFIG.externalStorage.github.repo || !PERSISTENT_CONFIG.externalStorage.github.token) {
        console.log('[PERSISTENT] Missing GitHub configuration');
        console.log(`[PERSISTENT] GITHUB_REPO: ${PERSISTENT_CONFIG.externalStorage.github.repo || 'NOT SET'}`);
        console.log(`[PERSISTENT] GITHUB_TOKEN: ${PERSISTENT_CONFIG.externalStorage.github.token ? 'SET' : 'NOT SET'}`);
        return { valid: false, error: 'GitHub repository or token not configured' };
      }

      // Test GitHub API access
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      console.log(`[PERSISTENT] Testing GitHub API connection to: ${PERSISTENT_CONFIG.externalStorage.github.repo}`);
      
      const testCmd = `curl -H "Authorization: token ${PERSISTENT_CONFIG.externalStorage.github.token}" https://api.github.com/repos/${PERSISTENT_CONFIG.externalStorage.github.repo}`;
      const { stdout } = await execAsync(testCmd);
      const repoInfo = JSON.parse(stdout);

      console.log(`[PERSISTENT] GitHub API response: ${JSON.stringify(repoInfo, null, 2)}`);

      if (repoInfo.message === 'Not Found') {
        console.log('[PERSISTENT] Repository not found or access denied');
        return { valid: false, error: 'Repository not found or access denied' };
      }

      if (repoInfo.message && repoInfo.message.includes('Bad credentials')) {
        console.log('[PERSISTENT] Invalid token');
        return { valid: false, error: 'Invalid GitHub token' };
      }

      if (repoInfo.message && repoInfo.message.includes('API rate limit exceeded')) {
        console.log('[PERSISTENT] API rate limit exceeded');
        return { valid: false, error: 'GitHub API rate limit exceeded' };
      }

      console.log(`[PERSISTENT] GitHub validation successful: ${repoInfo.full_name}`);
      return { valid: true, repoInfo };
    } catch (error) {
      console.error('[PERSISTENT] GitHub validation error:', error.message);
      console.error('[PERSISTENT] Error details:', error);
      return { valid: false, error: `GitHub validation failed: ${error.message}` };
    }
  }

  // Sync to external storage
  async syncToExternalStorage() {
    if (this.syncInProgress) {
      console.log('[PERSISTENT] Sync already in progress, skipping...');
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    
    try {
      console.log('[PERSISTENT] Starting external sync...');
      
      // Create comprehensive backup first
      const backupResult = await this.createComprehensiveBackup();
      if (!backupResult.success) {
        throw new Error(`Backup failed: ${backupResult.error}`);
      }

      // Try GitHub sync first
      if (PERSISTENT_CONFIG.externalStorage.github.enabled) {
        // Validate GitHub config first
        const validation = await this.validateGitHubConfig();
        if (!validation.valid) {
          console.log(`[PERSISTENT] GitHub validation failed: ${validation.error}`);
          throw new Error(`GitHub validation failed: ${validation.error}`);
        }

        const githubResult = await this.syncToGitHub(backupResult.backupId);
        if (githubResult.success) {
          console.log('[PERSISTENT] GitHub sync completed successfully');
          this.lastSyncTime = Date.now();
          this.syncInProgress = false;
          return { success: true, method: 'github', backupId: backupResult.backupId };
        } else {
          console.log(`[PERSISTENT] GitHub sync failed: ${githubResult.error}`);
        }
      }

      // Try cloud storage as fallback
      if (PERSISTENT_CONFIG.externalStorage.cloud.enabled) {
        const cloudResult = await this.syncToCloud(backupResult.backupId);
        if (cloudResult.success) {
          console.log('[PERSISTENT] Cloud sync completed successfully');
          this.lastSyncTime = Date.now();
          this.syncInProgress = false;
          return { success: true, method: 'cloud', backupId: backupResult.backupId };
        }
      }

      throw new Error('No external storage available or all sync methods failed');
      
    } catch (error) {
      console.error('[PERSISTENT] External sync failed:', error.message);
      this.syncInProgress = false;
      return { success: false, error: error.message };
    }
  }

  // Sync to GitHub
  async syncToGitHub(backupId) {
    try {
      if (!PERSISTENT_CONFIG.externalStorage.github.repo || !PERSISTENT_CONFIG.externalStorage.github.token) {
        throw new Error('GitHub configuration missing');
      }

      const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Use git commands to sync to GitHub
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Create a temporary directory for GitHub sync
      const tempGitDir = path.join('./temp', 'github-sync');
      if (fs.existsSync(tempGitDir)) {
        fs.rmSync(tempGitDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempGitDir, { recursive: true });

      try {
        // Configure git to avoid email issues
        await execAsync('git config --global user.email "bot@cappie.com"');
        await execAsync('git config --global user.name "Cappie Bot"');
        
        // Initialize git in temp directory
        await execAsync('git init', { cwd: tempGitDir });
        await execAsync(`git remote add origin https://${PERSISTENT_CONFIG.externalStorage.github.token}@github.com/${PERSISTENT_CONFIG.externalStorage.github.repo}.git`, { cwd: tempGitDir });
        
        // Create data-backup directory structure
        const dataBackupDir = path.join(tempGitDir, 'data-backup');
        fs.mkdirSync(dataBackupDir, { recursive: true });

        // Copy backup to temp directory
        const tempBackupDir = path.join(dataBackupDir, backupId);
        fs.cpSync(backupPath, tempBackupDir, { recursive: true });

        // Add and commit only the backup data
        await execAsync('git add data-backup/', { cwd: tempGitDir });
        
        // Check if there are changes to commit
        const { stdout: status } = await execAsync('git status --porcelain', { cwd: tempGitDir });
        if (!status.trim()) {
          console.log(`[PERSISTENT] No changes to commit for backup: ${backupId}`);
          return { success: true, message: 'No changes detected' };
        }

        // Commit with backup info
        const commitMessage = `Backup: ${backupId} - ${new Date().toISOString()}`;
        await execAsync(`git commit -m "${commitMessage}"`, { cwd: tempGitDir });
        
        // Push to data-backup branch with force (always overwrite)
        try {
          console.log('[PERSISTENT] Pushing to data-backup branch...');
          await execAsync('git push origin HEAD:data-backup --force', { cwd: tempGitDir });
        } catch (pushError) {
          // If branch doesn't exist, create it first
          if (pushError.message.includes('does not exist')) {
            console.log('[PERSISTENT] Creating data-backup branch...');
            await execAsync('git push origin HEAD:data-backup --set-upstream', { cwd: tempGitDir });
          } else {
            throw pushError;
          }
        }
        
        console.log(`[PERSISTENT] GitHub sync completed for backup: ${backupId}`);
        return { success: true };
        
      } finally {
        // Clean up temp directory
        if (fs.existsSync(tempGitDir)) {
          fs.rmSync(tempGitDir, { recursive: true, force: true });
        }
      }
      
    } catch (error) {
      console.error('[PERSISTENT] GitHub sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync to cloud storage (placeholder)
  async syncToCloud(backupId) {
    // Placeholder for cloud storage sync
    console.log(`[PERSISTENT] Cloud sync not implemented for backup: ${backupId}`);
    return { success: false, error: 'Cloud sync not implemented' };
  }

  // Restore from external storage
  async restoreFromExternalStorage(backupId = null) {
    try {
      console.log('[PERSISTENT] Attempting to restore from external storage...');
      
      // Try to restore from GitHub first if enabled
      if (PERSISTENT_CONFIG.externalStorage.github.enabled) {
        const validation = await this.validateGitHubConfig();
        if (validation.valid) {
          console.log('[PERSISTENT] GitHub available, attempting GitHub restore...');
          const githubRestore = require('./githubRestore');
          const githubRestorer = new githubRestore();
          
          if (backupId) {
            const result = await githubRestorer.restoreFromBackup(backupId);
            if (result.success) {
              console.log(`[PERSISTENT] GitHub restore successful: ${result.restoredCount} files`);
              return { success: true, successCount: result.restoredCount, method: 'github' };
            }
          } else {
            const result = await githubRestorer.restoreLatest();
            if (result.success) {
              console.log(`[PERSISTENT] GitHub restore successful: ${result.restoredCount} files`);
              return { success: true, successCount: result.restoredCount, method: 'github' };
            }
          }
          
          console.log('[PERSISTENT] GitHub restore failed, trying local restore...');
        }
      }
      
      // Fallback to local restore
      console.log('[PERSISTENT] Attempting local restore...');
      
      // Try to restore from latest backup if no specific ID
      if (!backupId) {
        const backups = this.getAvailableBackups();
        if (backups.length === 0) {
          throw new Error('No backups available for restore');
        }
        backupId = backups[0].id; // Use latest backup
      }
      
      const backupPath = path.join(PERSISTENT_CONFIG.localBackupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup ${backupId} not found locally`);
      }
      
      // Restore files
      const filesToRestore = ['users.json', 'shop.json', 'emojis.json'];
      let successCount = 0;
      
      for (const file of filesToRestore) {
        const sourcePath = path.join(backupPath, file);
        const destPath = path.join(PERSISTENT_CONFIG.localDataDir, file);
        
        if (fs.existsSync(sourcePath)) {
          try {
            fs.copyFileSync(sourcePath, destPath);
            successCount++;
            console.log(`[PERSISTENT] Restored: ${file}`);
          } catch (error) {
            console.error(`[PERSISTENT] Error restoring ${file}:`, error.message);
          }
        }
      }
      
      console.log(`[PERSISTENT] Local restore completed: ${successCount}/${filesToRestore.length} files`);
      return { success: true, successCount, method: 'local' };
      
    } catch (error) {
      console.error('[PERSISTENT] Restore failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get storage status
  async getStorageStatus() {
    const status = {
      connected: false,
      method: null,
      url: null,
      error: null
    };

    try {
      // Check GitHub first
      if (PERSISTENT_CONFIG.externalStorage.github.enabled) {
        const validation = await this.validateGitHubConfig();
        if (validation.valid) {
          status.connected = true;
          status.method = 'GitHub';
          status.url = `https://github.com/${PERSISTENT_CONFIG.externalStorage.github.repo}`;
          return status;
        } else {
          status.error = validation.error;
        }
      }

      // Check cloud storage
      if (PERSISTENT_CONFIG.externalStorage.cloud.enabled) {
        status.method = 'Cloud';
        status.error = 'Cloud storage not implemented';
      }

      return status;
    } catch (error) {
      status.error = error.message;
      return status;
    }
  }

  // Get available backups
  getAvailableBackups() {
    try {
      const backups = [];
      const backupDir = PERSISTENT_CONFIG.localBackupDir;
      
      if (fs.existsSync(backupDir)) {
        const items = fs.readdirSync(backupDir);
        
        for (const item of items) {
          const fullPath = path.join(backupDir, item);
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
      
      // Sort by time (newest first)
      return backups.sort((a, b) => b.time - a.time);
      
    } catch (error) {
      console.error('[PERSISTENT] Error getting available backups:', error.message);
      return [];
    }
  }

  // Start auto-sync
  startAutoSync() {
    console.log('[PERSISTENT] Starting auto-sync system...');
    
    // Initial sync
    this.syncToExternalStorage();
    
    // Set up interval
    this.syncTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastSyncTime > PERSISTENT_CONFIG.autoSyncInterval) {
        this.syncToExternalStorage();
      }
    }, PERSISTENT_CONFIG.autoSyncInterval);
  }

  // Stop auto-sync
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[PERSISTENT] Auto-sync stopped');
    }
  }

  // Emergency backup
  async emergencyBackup() {
    console.log('[PERSISTENT] Creating emergency backup...');
    try {
      const result = await this.createComprehensiveBackup();
      if (result.success) {
        console.log('[PERSISTENT] Emergency backup created successfully');
      }
      return result;
    } catch (error) {
      console.error('[PERSISTENT] Emergency backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Setup graceful shutdown
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
}

module.exports = PersistentStorage; 