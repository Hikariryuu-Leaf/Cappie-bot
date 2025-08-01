const { loadJSON, saveJSON, voiceTime } = require('../utils/database');

const INTERVAL = 10 * 60 * 1000; // 10 phút
const CARTRIDGE_PER_INTERVAL = 1; // Cartridge mỗi 10 phút

function start(client) {
  console.log('[VOICE TRACKER] Bắt đầu theo dõi voice...');
  
  setInterval(async () => {
    try {
      client.guilds.cache.forEach(async guild => {
        const voiceStates = guild.voiceStates.cache;

        voiceStates.forEach(async (state) => {
          const member = state.member;

          // Bỏ qua nếu bot, deaf, hoặc không thực sự join voice
          if (
            !member ||
            member.user.bot ||
            state.channel === null ||
            state.selfDeaf ||
            state.serverDeaf
          ) return;

          const users = loadJSON('./data/users.json');
          const userId = member.id;
          
          // Khởi tạo user nếu chưa có
          if (!users[userId]) {
            users[userId] = {
              cartridge: 0,
              voiceTime: 0,
              totalVoice: 0,
              lastClaim: 0
            };
          }

          // Thêm cartridge cho thời gian voice
          users[userId].cartridge += CARTRIDGE_PER_INTERVAL;
          users[userId].voiceTime += 10; // Thêm 10 phút vào voice time
          users[userId].totalVoice += 10;
          
          saveJSON('./data/users.json', users);

          console.log(`[VOICE] +${CARTRIDGE_PER_INTERVAL} Cartridge cho ${member.user.tag}`);
        });
      });
    } catch (error) {
      console.error('[VOICE TRACKER] Lỗi:', error);
    }
  }, INTERVAL);
}

module.exports = { start };
