const fs = require('fs');
const path = require('path');

// Đọc JSON từ file
function loadJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

// Ghi JSON vào file
function saveJSON(filePath, data) {
  // Đảm bảo thư mục tồn tại
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Khởi tạo user data
function initUser(userId) {
  const users = loadJSON('./data/users.json');
  if (!users[userId]) {
    users[userId] = {
      cartridge: 0,
      voiceTime: 0,
      totalVoice: 0,
      lastClaim: 0,
      joinTime: null
    };
    saveJSON('./data/users.json', users);
  }
  return users[userId];
}

// Lấy user data
function getUserData(userId) {
  const users = loadJSON('./data/users.json');
  if (!users[userId]) {
    return initUser(userId);
  }
  return users[userId];
}

// Cập nhật user data
function updateUserData(userId, data) {
  const users = loadJSON('./data/users.json');
  users[userId] = { ...users[userId], ...data };
  saveJSON('./data/users.json', users);
}

// Voice time tracking
const voiceTime = {
  data: new Map(),
  
  setJoin(userId, time) {
    this.data.set(userId, { joinTime: time });
  },
  
  get(userId) {
    return this.data.get(userId);
  },
  
  addTime(userId, timeSpent) {
    const users = loadJSON('./data/users.json');
    if (!users[userId]) {
      users[userId] = { cartridge: 0, voiceTime: 0, totalVoice: 0, lastClaim: 0 };
    }
    
    // Convert milliseconds to minutes for accurate tracking
    const timeInMinutes = Math.floor(timeSpent / 60000);
    
    // Only add time if it's reasonable (prevent huge jumps)
    if (timeInMinutes > 0 && timeInMinutes < 1440) { // Max 24 hours per session
      users[userId].voiceTime += timeInMinutes;
      users[userId].totalVoice += timeInMinutes;
      saveJSON('./data/users.json', users);
      console.log(`[VOICE] Added ${timeInMinutes} minutes for user ${userId}`);
    } else {
      console.warn(`[VOICE] Skipped adding ${timeInMinutes} minutes for user ${userId} (unreasonable time)`);
    }
  }
};

module.exports = { 
  loadJSON, 
  saveJSON, 
  initUser, 
  getUserData, 
  updateUserData,
  voiceTime
};
