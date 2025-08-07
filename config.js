require('dotenv').config();

module.exports = {
  ownerId: process.env.OWNER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  exclusiveRoleId: process.env.EXCLUSIVE_ROLE_ID,
  defaultEmoji: '🎁',
  voiceTrackerInterval: 10 * 60 * 1000, // 10 phút
  cartridgePerInterval: 1, // Cartridge mỗi 10 phút
  dailyClaimCooldown: 24 * 60 * 60 * 1000, // 24 giờ
  maxDailyReward: 100, // Phần thưởng tối đa cho user thường
  maxNitroReward: 200, // Phần thưởng tối đa cho user có Nitro
};
