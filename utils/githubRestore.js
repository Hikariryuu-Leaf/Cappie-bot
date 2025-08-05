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

      // Test GitHub API access
      const testCmd = `curl -H "Authorization: token ${this.token}" https://api.github.com/repos/${this.repo}`;
      const { stdout } = await execAsync(testCmd);
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
      const { stdout } = await execAsync(cmd);
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

      // Download backup files
      const files = ['users.json', 'shop.json', 'emojis.json', 'metadata.json'];
      let successCount = 0;

      for (const file of files) {
        try {
          const filePath = `data-backup/${backupId}/${file}`;
          const cmd = `curl -H "Authorization: token ${this.token}" https://api.github.com/repos/${this.repo}/contents/${filePath}`;
          const { stdout } = await execAsync(cmd);
          const fileInfo = JSON.parse(stdout);
          
          // Download file content
          const downloadCmd = `curl -H "Authorization: token ${this.token}" "${fileInfo.download_url}"`;
          const { stdout: fileContent } = await execAsync(downloadCmd);
          
          // Save to temp directory
          const localPath = path.join(tempDir, file);
          fs.writeFileSync(localPath, fileContent);
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
      
      // Download backup
      const downloadResult = await this.downloadBackup(backupId);
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
            fs.copyFileSync(sourcePath, destPath);
            restoredCount++;
            console.log(`[GITHUB] ✅ Đã khôi phục: ${file}`);
          } catch (error) {
            console.error(`[GITHUB] ❌ Lỗi khôi phục ${file}:`, error.message);
          }
        }
      }

      // Clean up temp directory
      try {
        fs.rmSync(downloadResult.tempDir, { recursive: true, force: true });
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
      
      const backups = await this.listBackups();
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