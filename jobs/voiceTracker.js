const { loadJSON, saveJSON } = require('../utils/database');

// Lưu trữ thời gian join voice của từng user
const voiceJoinTimes = new Map();

function start(client) {
  console.log('[VOICE TRACKER] Bắt đầu theo dõi voice...');
  
  // Xử lý khi user join voice
  client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.member?.id;
    if (!userId || newState.member?.user?.bot) return;

    // User join voice
    if (!oldState.channel && newState.channel) {
      voiceJoinTimes.set(userId, Date.now());
      console.log(`[VOICE] ${newState.member.user.tag} joined voice channel`);
    }
    
    // User leave voice
    if (oldState.channel && !newState.channel) {
      const joinTime = voiceJoinTimes.get(userId);
      if (joinTime) {
        const timeSpent = Math.floor((Date.now() - joinTime) / 1000); // Thời gian tính bằng giây
        addVoiceTime(userId, timeSpent, newState.member.user.tag);
        voiceJoinTimes.delete(userId);
        console.log(`[VOICE] ${newState.member.user.tag} left voice channel after ${timeSpent}s`);
      }
    }
  });

  // Log voice tracking status
  console.log('[VOICE TRACKER] Voice tracking system ready - Cartridge will be awarded based on actual voice time (1 cartridge per 10 minutes)');
}

// Hàm cộng thời gian voice và cartridge
function addVoiceTime(userId, timeSpent, userTag) {
  try {
    const users = loadJSON('./data/users.json');
    
    if (!users[userId]) {
      users[userId] = {
        cartridge: 0,
        voiceTime: 0,
        totalVoice: 0,
        lastClaim: 0
      };
    }

    // Cộng thời gian voice
    users[userId].totalVoice = (users[userId].totalVoice || 0) + timeSpent;
    
    // Tính cartridge dựa trên thời gian thực (1 cartridge = 600 giây = 10 phút)
    const cartridgeEarned = Math.floor(timeSpent / 600);
    if (cartridgeEarned > 0) {
      users[userId].cartridge = (users[userId].cartridge || 0) + cartridgeEarned;
      console.log(`[VOICE] +${cartridgeEarned} Cartridge cho ${userTag} (${timeSpent}s voice time = ${cartridgeEarned} cartridge)`);
      console.log(`[VOICE] ${userTag} hiện có: ${users[userId].cartridge} Cartridge total`);
    } else {
      console.log(`[VOICE] ${userTag} voice ${timeSpent}s (chưa đủ 10 phút để nhận cartridge)`);
    }

    saveJSON('./data/users.json', users);
  } catch (error) {
    console.error('[VOICE TRACKER] Lỗi khi cộng voice time:', error);
  }
}

module.exports = { start };
