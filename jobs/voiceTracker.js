const { loadUser, saveUser } = require('../utils/database');

// Hàm này chỉ là ví dụ, bạn có thể điều chỉnh logic nếu cần
async function trackVoiceTime(userId, timeToAdd) {
  let user = await loadUser(userId);
  user.totalVoice = (user.totalVoice || 0) + timeToAdd;
  await saveUser(user);
}

module.exports = { trackVoiceTime };
