const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class GitHubRestore {
  constructor() {
    this.repo = process.env.GITHUB_REPO;
    this.token = process.env.GITHUB_TOKEN;
    this.branch = 'data-backup';
    this.localDataDir = './data';
  }

  async checkGitHubAccess() {
    try {
      console.log('[GITHUB] Kiểm tra quyền truy cập GitHub...');
      
      if (!this.repo || !this.token) {
        throw new Error('GITHUB_REPO hoặc GITHUB_TOKEN chưa được cấu hình');
      }

      // Test GitHub API access with timeout
      const testCmd = `curl -H "Authorization: token ${this.token}" https://api.github.com/repos/${this.repo}`;
      const execPromise = execAsync(testCmd);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GitHub access check timed out after 5 seconds')), 5000);
      });
      
      const { stdout } = await Promise.race([execPromise, timeoutPromise]);
      const repoInfo = JSON.parse(stdout);
      
      console.log(`[GITHUB] ✅ Kết nối thành công với repository: ${repoInfo.full_name}`);
      return true;
    } catch (error) {
      console.error('[GITHUB] ❌ Không thể kết nối GitHub:', error.message);
      return false;
    }
  }

  async listBackups() {
    try {
      console.log('[GITHUB] Đang lấy danh sách backup từ GitHub...');
      
      const cmd = `curl -H "Authorization: token ${this.token}" https://api.github.com/repos/${this.repo}/contents/data-backup`;
      
      // Add timeout for list operation
      const execPromise = execAsync(cmd);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GitHub list operation timed out after 8 seconds')), 8000);
      });
      
      const { stdout } = await Promise.race([execPromise, timeoutPromise]);
      const contents = JSON.parse(stdout);
      
      const backups = contents
        .filter(item => item.type === 'dir' && item.name.startsWith('backup_'))
        .map(item => ({
          id: item.name,
          path: item.path,
          url: item.url,
          size: item.size,
          time: new Date(item.created_at).getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      console.log(`[GITHUB] Tìm thấy ${backups.length} backup trên GitHub`);
      return backups;
    } catch (error) {
      console.error('[GITHUB] Lỗi khi lấy danh sách backup:', error.message);
      return [];
    }
  }

  async downloadBackup(backupId) {
    try {
      console.log(`[GITHUB] Đang tải backup ${backupId} từ GitHub...`);
      
      // Create temp directory
      const tempDir = path.join('./temp', backupId);
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp', { recursive: true });
      }
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Download backup files with timeout
      const files = ['users.json', 'shop.json', 'emojis.json', 'metadata.json'];
      let successCount = 0;

      for (const file of files) {
        try {
          const filePath = `data-backup/${backupId}/${file}`;
          const cmd = `curl -H "Authorization: token ${this.token}" https://api.github.com/repos/${this.repo}/contents/${filePath}`;
          
          // Add timeout for curl operations
          const execPromise = execAsync(cmd);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Download timeout for ${file}`)), 5000);
          });
          
          const { stdout } = await Promise.race([execPromise, timeoutPromise]);
          const fileInfo = JSON.parse(stdout);
          
          // Download file content
          if (!fileInfo.download_url) {
            console.log(`[GITHUB] ⚠️ Không thể tải: ${file} (download_url không tồn tại)`);
            continue;
          }
          const downloadCmd = `curl -H "Authorization: token ${this.token}" "${fileInfo.download_url}"`;
          
          // Add timeout for download
          const downloadPromise = execAsync(downloadCmd);
          const downloadTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Download content timeout for ${file}`)), 5000);
          });
          
          const { stdout: fileContent } = await Promise.race([downloadPromise, downloadTimeoutPromise]);
          
          // Save to temp directory
          const localPath = path.join(tempDir, file);
          const fsPromises = require('fs').promises;
          await fsPromises.writeFile(localPath, fileContent);
          successCount++;
          
          console.log(`[GITHUB] ✅ Đã tải: ${file}`);
        } catch (error) {
          console.log(`[GITHUB] ⚠️ Không thể tải: ${file} (${error.message})`);
        }
      }

      console.log(`[GITHUB] Tải xong: ${successCount}/${files.length} files`);
      return { success: successCount > 0, tempDir, successCount };
    } catch (error) {
      console.error('[GITHUB] Lỗi khi tải backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  async restoreFromBackup(backupId) {
    try {
      console.log(`[GITHUB] Bắt đầu khôi phục từ backup ${backupId}...`);
      
      // Add timeout for GitHub operations
      const downloadPromise = this.downloadBackup(backupId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GitHub download timed out after 15 seconds')), 15000);
      });

      // Download backup with timeout
      const downloadResult = await Promise.race([downloadPromise, timeoutPromise]);
      if (!downloadResult.success) {
        throw new Error(`Không thể tải backup: ${downloadResult.error}`);
      }

      // Ensure data directory exists
      if (!fs.existsSync(this.localDataDir)) {
        fs.mkdirSync(this.localDataDir, { recursive: true });
      }

      // Restore files
      const filesToRestore = ['users.json', 'shop.json', 'emojis.json'];
      let restoredCount = 0;

      for (const file of filesToRestore) {
        const sourcePath = path.join(downloadResult.tempDir, file);
        const destPath = path.join(this.localDataDir, file);
        
        if (fs.existsSync(sourcePath)) {
          try {
            // Use async file operations
            const fsPromises = require('fs').promises;
            await fsPromises.copyFile(sourcePath, destPath);
            restoredCount++;
            console.log(`[GITHUB] ✅ Đã khôi phục: ${file}`);
          } catch (error) {
            console.error(`[GITHUB] ❌ Lỗi khôi phục ${file}:`, error.message);
          }
        }
      }

      // Clean up temp directory
      try {
        const fsPromises = require('fs').promises;
        await fsPromises.rm(downloadResult.tempDir, { recursive: true, force: true });
        console.log('[GITHUB] Đã dọn dẹp thư mục tạm');
      } catch (cleanupError) {
        console.log('[GITHUB] Không thể dọn dẹp thư mục tạm:', cleanupError.message);
      }

      console.log(`[GITHUB] Khôi phục hoàn tất: ${restoredCount}/${filesToRestore.length} files`);
      return { success: true, restoredCount };
    } catch (error) {
      console.error('[GITHUB] Lỗi khôi phục:', error.message);
      return { success: false, error: error.message };
    }
  }

  async restoreLatest() {
    try {
      console.log('[GITHUB] Đang tìm backup mới nhất...');
      
      // Add timeout for list operation
      const listPromise = this.listBackups();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GitHub list operation timed out after 10 seconds')), 10000);
      });

      const backups = await Promise.race([listPromise, timeoutPromise]);
      if (backups.length === 0) {
        throw new Error('Không tìm thấy backup nào trên GitHub');
      }

      const latestBackup = backups[0];
      console.log(`[GITHUB] Sử dụng backup mới nhất: ${latestBackup.id}`);
      
      return await this.restoreFromBackup(latestBackup.id);
    } catch (error) {
      console.error('[GITHUB] Lỗi khôi phục backup mới nhất:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GitHubRestore; 