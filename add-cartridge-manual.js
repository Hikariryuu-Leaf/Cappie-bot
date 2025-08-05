const fs = require('fs');
const path = require('path');

function addCartridgeManually() {
  console.log('🎯 Cộng Cartridge Thủ Công\n');
  
  const usersPath = './data/users.json';
  
  try {
    // 1. Kiểm tra file users.json
    if (!fs.existsSync(usersPath)) {
      console.log('❌ Không tìm thấy file users.json');
      return;
    }
    
    // 2. Đọc dữ liệu hiện tại
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    console.log(`📊 Hiện tại có ${Object.keys(users).length} users`);
    
    // 3. Nhập thông tin user
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Nhập Discord User ID của bạn: ', (userId) => {
      rl.question('Nhập số lượng cartridge muốn cộng: ', (amount) => {
        rl.question('Nhập username của bạn: ', (username) => {
          rl.close();
          
          // 4. Cộng cartridge
          if (!users[userId]) {
            users[userId] = {
              cartridge: 0,
              voiceTime: 0,
              totalVoice: 0,
              lastClaim: 0,
              username: username
            };
          }
          
          const oldCartridge = users[userId].cartridge || 0;
          const newCartridge = oldCartridge + parseInt(amount);
          users[userId].cartridge = newCartridge;
          users[userId].username = username;
          
          // 5. Lưu dữ liệu
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
          
          console.log('\n✅ Cộng Cartridge Thành Công!');
          console.log(`👤 User: ${username} (${userId})`);
          console.log(`📊 Cartridge cũ: ${oldCartridge}`);
          console.log(`📈 Cartridge mới: ${newCartridge}`);
          console.log(`➕ Đã cộng: +${amount}`);
          console.log('\n💡 Bây giờ bạn có thể sử dụng lệnh /profile để kiểm tra!');
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

// Chạy script
addCartridgeManually(); 