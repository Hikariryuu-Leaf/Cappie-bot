require('dotenv').config();
const GitHubRestore = require('./utils/githubRestore');

async function testGitHubRestore() {
  console.log('🔍 Kiểm tra khôi phục dữ liệu từ GitHub...\n');
  
  const githubRestore = new GitHubRestore();
  
  try {
    // 1. Kiểm tra kết nối GitHub
    console.log('📡 Bước 1: Kiểm tra kết nối GitHub...');
    const hasAccess = await githubRestore.checkGitHubAccess();
    if (!hasAccess) {
      console.log('❌ Không thể kết nối GitHub. Kiểm tra GITHUB_REPO và GITHUB_TOKEN');
      return;
    }
    console.log('✅ Kết nối GitHub thành công!\n');
    
    // 2. Lấy danh sách backup
    console.log('📋 Bước 2: Lấy danh sách backup...');
    const backups = await githubRestore.listBackups();
    if (backups.length === 0) {
      console.log('❌ Không tìm thấy backup nào trên GitHub');
      return;
    }
    
    console.log(`✅ Tìm thấy ${backups.length} backup:`);
    backups.slice(0, 5).forEach((backup, index) => {
      const date = new Date(backup.time).toLocaleString('vi-VN');
      console.log(`   ${index + 1}. ${backup.id} (${date})`);
    });
    console.log('');
    
    // 3. Khôi phục backup mới nhất
    console.log('🔄 Bước 3: Khôi phục backup mới nhất...');
    const restoreResult = await githubRestore.restoreLatest();
    
    if (restoreResult.success) {
      console.log(`✅ Khôi phục thành công! Đã khôi phục ${restoreResult.restoredCount}/3 files`);
      console.log('📁 Dữ liệu đã được khôi phục vào thư mục ./data/');
    } else {
      console.log(`❌ Khôi phục thất bại: ${restoreResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

// Chạy test
testGitHubRestore(); 