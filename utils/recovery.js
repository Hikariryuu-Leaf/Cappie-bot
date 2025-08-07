const fs = require('fs');
const path = require('path');

// Đã loại bỏ mọi thao tác file, chỉ dùng MongoDB

// Tạo thư mục cần thiết
function ensureDirectories() {
  const dirs = ['./data', './data/backups', './data/temp', './manual_backups'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[RECOVERY] Created directory: ${dir}`);
    }
  });
}

// Tìm tất cả file JSON trong thư mục
function findJSONFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findJSONFiles(fullPath));
      } else if (item.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`[RECOVERY] Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Kiểm tra file có chứa dữ liệu hợp lệ không
function isValidDataFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Kiểm tra nếu là users.json, phải có ít nhất 1 user
    if (path.basename(filePath) === 'users.json') {
      return typeof data === 'object' && Object.keys(data).length > 0;
    }
    
    // Kiểm tra các file khác
    return typeof data === 'object';
  } catch (error) {
    return false;
  }
}

// Khôi phục dữ liệu từ file backup
function restoreFromFile(sourcePath, destPath) {
  try {
    const content = fs.readFileSync(sourcePath, 'utf8');
    const data = JSON.parse(content);
    
    // Tạo backup của file hiện tại trước khi ghi đè
    if (fs.existsSync(destPath)) {
      const backupName = `recovery_backup_${Date.now()}.json`;
      const backupPath = path.join(DB_CONFIG.backupDir, backupName);
      fs.copyFileSync(destPath, backupPath);
      console.log(`[RECOVERY] Created backup of current file: ${backupName}`);
    }
    
    // Ghi đè file đích
    fs.writeFileSync(destPath, JSON.stringify(data, null, 2));
    console.log(`[RECOVERY] Restored ${sourcePath} -> ${destPath}`);
    return true;
  } catch (error) {
    console.error(`[RECOVERY] Error restoring ${sourcePath}:`, error.message);
    return false;
  }
}

// Tìm và khôi phục dữ liệu
function findAndRecoverData() {
  console.log('[RECOVERY] Starting data recovery process...');
  
  // Tạo thư mục cần thiết
  ensureDirectories();
  
  // Tìm tất cả file JSON trong workspace
  const allJSONFiles = findJSONFiles('.');
  console.log(`[RECOVERY] Found ${allJSONFiles.length} JSON files in workspace`);
  
  // Lọc các file có thể chứa dữ liệu backup
  const potentialBackups = allJSONFiles.filter(file => {
    const fileName = path.basename(file);
    const dirName = path.dirname(file);
    
    // Bỏ qua các file trong thư mục node_modules
    if (file.includes('node_modules')) return false;
    
    // Tìm các file có thể là backup
    return (
      fileName.includes('backup') ||
      fileName.includes('users') ||
      fileName.includes('shop') ||
      fileName.includes('emojis') ||
      dirName.includes('backup') ||
      dirName.includes('manual')
    );
  });
  
  console.log(`[RECOVERY] Found ${potentialBackups.length} potential backup files`);
  
  // Kiểm tra từng file
  const validBackups = [];
  for (const file of potentialBackups) {
    if (isValidDataFile(file)) {
      validBackups.push(file);
      console.log(`[RECOVERY] Valid backup found: ${file}`);
    }
  }
  
  console.log(`[RECOVERY] Found ${validBackups.length} valid backup files`);
  
  // Thử khôi phục dữ liệu
  let restoredCount = 0;
  
  for (const backupFile of validBackups) {
    const fileName = path.basename(backupFile);
    const fileDir = path.dirname(backupFile);
    
    // Xác định loại file và đường dẫn đích
    let destPath = null;
    
    if (fileName.includes('users') || fileName.includes('user')) {
      destPath = path.join(DB_CONFIG.dataDir, 'users.json');
    } else if (fileName.includes('shop')) {
      destPath = path.join(DB_CONFIG.dataDir, 'shop.json');
    } else if (fileName.includes('emojis') || fileName.includes('emoji')) {
      destPath = path.join(DB_CONFIG.dataDir, 'emojis.json');
    }
    
    if (destPath && restoreFromFile(backupFile, destPath)) {
      restoredCount++;
    }
  }
  
  console.log(`[RECOVERY] Successfully restored ${restoredCount} files`);
  
  // Kiểm tra kết quả
  const currentUsersPath = path.join(DB_CONFIG.dataDir, 'users.json');
  if (fs.existsSync(currentUsersPath)) {
    const usersData = JSON.parse(fs.readFileSync(currentUsersPath, 'utf8'));
    const userCount = Object.keys(usersData).length;
    console.log(`[RECOVERY] Current users.json contains ${userCount} users`);
    
    if (userCount > 0) {
      console.log('[RECOVERY] ✅ Data recovery successful!');
      return true;
    } else {
      console.log('[RECOVERY] ❌ No user data found in recovered file');
    }
  }
  
  return false;
}

// Tạo dữ liệu mẫu nếu không thể khôi phục
function createSampleData() {
  console.log('[RECOVERY] Creating sample data structure...');
  
  const sampleUsers = {
    "sample_user_1": {
      "id": "sample_user_1",
      "username": "Sample User",
      "balance": 1000,
      "level": 1,
      "xp": 0,
      "joinDate": new Date().toISOString(),
      "lastSeen": new Date().toISOString(),
      "timeSpent": 0,
      "inventory": [],
      "settings": {
        "notifications": true,
        "language": "vi"
      }
    }
  };
  
  const sampleShop = {
    "Role độc quyền Cartridge": 2300,
    "Role Custom": 1200,
    "50K tiền mặt": 2800,
    "Nitro Basic": 3300
  };
  
  const sampleEmojis = {
    "emoji": "🎁"
  };
  
  // Lưu dữ liệu mẫu
  fs.writeFileSync(path.join(DB_CONFIG.dataDir, 'users.json'), JSON.stringify(sampleUsers, null, 2));
  fs.writeFileSync(path.join(DB_CONFIG.dataDir, 'shop.json'), JSON.stringify(sampleShop, null, 2));
  fs.writeFileSync(path.join(DB_CONFIG.dataDir, 'emojis.json'), JSON.stringify(sampleEmojis, null, 2));
  
  console.log('[RECOVERY] Sample data created');
}

// Hàm chính
function main() {
  console.log('=== DATA RECOVERY TOOL ===');
  console.log('This tool will attempt to recover lost bot data');
  console.log('');
  
  // Thử khôi phục dữ liệu
  const recoverySuccess = findAndRecoverData();
  
  if (!recoverySuccess) {
    console.log('');
    console.log('[RECOVERY] No valid backup data found');
    console.log('[RECOVERY] Creating sample data structure...');
    createSampleData();
  }
  
  console.log('');
  console.log('=== RECOVERY COMPLETE ===');
  console.log('Please restart your bot to apply changes');
}

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  main();
}

module.exports = {
  findAndRecoverData,
  createSampleData,
  ensureDirectories
}; 