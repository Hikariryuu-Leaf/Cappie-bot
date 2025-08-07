const { loadAllUsers, saveUser } = require('../utils/database');

// Hàm này chỉ là ví dụ, bạn có thể điều chỉnh logic nếu cần
async function trackVoiceTime(userId, timeToAdd) {
  let user = await loadUser(userId);
  user.totalVoice = (user.totalVoice || 0) + timeToAdd;
  await saveUser(user);
}

// Chạy mỗi phút
function startVoiceRewardJob() {
  setInterval(async () => {
    try {
      const users = await loadAllUsers();
      const now = Date.now();
      for (const user of users) {
        if (typeof user.joinTime === 'number' && user.joinTime > 0) {
          // Đã ở voice đủ 10 phút
          if (now - user.joinTime >= 10 * 60 * 1000) {
            user.cartridge = (user.cartridge || 0) + 1;
            user.joinTime = now; // reset mốc
            await saveUser(user);
            console.log(`[VOICE REWARD] +1 cartridge cho user ${user.userId}`);
          }
        }
      }
    } catch (err) {
      console.error('[VOICE REWARD JOB] Error:', err);
    }
  }, 60 * 1000); // mỗi phút
}

module.exports = { trackVoiceTime, startVoiceRewardJob };
