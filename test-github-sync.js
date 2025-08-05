require('dotenv').config();
const PersistentStorage = require('./utils/persistentStorage');

async function testGitHubSync() {
  console.log('🔍 Test GitHub Sync\n');
  
  const persistentStorage = new PersistentStorage();
  
  try {
    // 1. Kiểm tra cấu hình GitHub
    console.log('📡 Bước 1: Kiểm tra cấu hình GitHub...');
    const githubConfig = {
      repo: process.env.GITHUB_REPO,
      token: process.env.GITHUB_TOKEN
    };
    
    if (!githubConfig.repo || !githubConfig.token) {
      console.log('❌ Chưa cấu hình GitHub:');
      console.log(`   GITHUB_REPO: ${githubConfig.repo || 'CHƯA CÓ'}`);
      console.log(`   GITHUB_TOKEN: ${githubConfig.token ? 'ĐÃ CÓ' : 'CHƯA CÓ'}`);
      console.log('\n💡 Hãy tạo file .env với nội dung:');
      console.log('   GITHUB_REPO=your-username/my-discord-bot-backup');
      console.log('   GITHUB_TOKEN=ghp_your_token_here');
      return;
    }
    
    console.log('✅ Cấu hình GitHub đã có');
    console.log(`   Repository: ${githubConfig.repo}`);
    console.log(`   Token: ${githubConfig.token ? 'Đã cấu hình' : 'Chưa có'}`);
    console.log('');
    
    // 2. Tạo backup test
    console.log('📦 Bước 2: Tạo backup test...');
    const backupResult = await persistentStorage.createComprehensiveBackup();
    
    if (!backupResult.success) {
      console.log(`❌ Tạo backup thất bại: ${backupResult.error}`);
      return;
    }
    
    console.log(`✅ Backup tạo thành công: ${backupResult.backupId}`);
    console.log(`   Files: ${backupResult.successCount}/${backupResult.totalFiles}`);
    console.log('');
    
    // 3. Test sync lên GitHub
    console.log('🚀 Bước 3: Test sync lên GitHub...');
    const syncResult = await persistentStorage.syncToExternalStorage();
    
    if (syncResult.success) {
      console.log(`✅ Sync thành công! Method: ${syncResult.method}`);
      console.log('📁 Dữ liệu đã được sync lên GitHub');
    } else {
      console.log(`❌ Sync thất bại: ${syncResult.error}`);
      console.log('\n💡 Có thể do:');
      console.log('   - Repository chưa tồn tại');
      console.log('   - Token không có quyền');
      console.log('   - Network issues');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

// Chạy test
testGitHubSync(); 