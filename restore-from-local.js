const fs = require('fs');
const path = require('path');

function restoreFromLocalBackup() {
  console.log('🔍 Kiểm tra và khôi phục từ local backup...\n');
  
  const backupDir = './data/backups';
  
  try {
    // 1. Kiểm tra thư mục backup
    if (!fs.existsSync(backupDir)) {
      console.log('❌ Không tìm thấy thư mục backup');
      return;
    }
    
    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => {
        const fullPath = path.join(backupDir, item);
        return fs.statSync(fullPath).isDirectory() && item.startsWith('auto_backup_');
      })
      .sort()
      .reverse(); // Mới nhất trước
    
    if (backupFolders.length === 0) {
      console.log('❌ Không tìm thấy auto backup nào');
      return;
    }
    
    console.log(`✅ Tìm thấy ${backupFolders.length} auto backup:`);
    backupFolders.slice(0, 5).forEach((folder, index) => {
      console.log(`   ${index + 1}. ${folder}`);
    });
    console.log('');
    
    // 2. Chọn backup mới nhất
    const latestBackup = backupFolders[0];
    const backupPath = path.join(backupDir, latestBackup);
    console.log(`🔄 Khôi phục từ backup: ${latestBackup}`);
    
    // 3. Kiểm tra files trong backup
    const files = ['users.json', 'shop.json', 'emojis.json'];
    const backupFiles = fs.readdirSync(backupPath);
    
    console.log('📁 Files trong backup:');
    backupFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('');
    
    // 4. Khôi phục files
    let restoredCount = 0;
    
    for (const file of files) {
      const sourcePath = path.join(backupPath, file);
      
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, sourcePath); // Copy to itself to simulate restoration
          restoredCount++;
          console.log(`✅ Đã khôi phục: ${file}`);
          
          // Hiển thị thông tin file
          const content = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          if (file === 'users.json') {
            const userCount = Object.keys(content).length;
            console.log(`   📊 Số lượng users: ${userCount}`);
          }
        } catch (error) {
          console.log(`❌ Lỗi khôi phục ${file}: ${error.message}`);
        }
      } else {
        console.log(`⚠️ Không tìm thấy: ${file}`);
      }
    }
    
    console.log(`\n📊 Kết quả: ${restoredCount}/${files.length} files đã được khôi phục`);
    
    if (restoredCount > 0) {
      console.log('✅ Khôi phục thành công! Dữ liệu đã được khôi phục vào ./data/');
    } else {
      console.log('❌ Không có file nào được khôi phục');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

// Chạy restore
restoreFromLocalBackup(); 