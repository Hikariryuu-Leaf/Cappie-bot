const { Events } = require('discord.js');
const { voiceTime, initUser } = require('../utils/database');

module.exports = {
  name: Events.VoiceStateUpdate,
  
  async execute(oldState, newState) {
    const member = newState.member;
    const userId = member.id;

    // Bỏ qua bot
    if (member.user.bot) return;

    // Khởi tạo dữ liệu nếu chưa có
    initUser(userId);

    // THAM GIA voice
    if (!oldState.channelId && newState.channelId) {
      voiceTime.setJoin(userId, Date.now());
      console.log(`[VOICE] ${member.user.tag} đã tham gia voice channel`);
    }

    // RỜI KHỎI voice
    else if (oldState.channelId && !newState.channelId) {
      const data = voiceTime.get(userId);
      if (data && data.joinTime) {
        const timeSpent = Date.now() - data.joinTime;
        voiceTime.addTime(userId, timeSpent);
        data.joinTime = null;

        console.log(`[VOICE] ${member.user.tag} đã rời voice channel sau ${Math.floor(timeSpent / 60000)} phút`);
      }
    }

    // DI CHUYỂN GIỮA CÁC KÊNH voice
    else if (oldState.channelId !== newState.channelId) {
      const data = voiceTime.get(userId);
      if (data && data.joinTime) {
        const timeSpent = Date.now() - data.joinTime;
        voiceTime.addTime(userId, timeSpent);
        data.joinTime = Date.now();

        console.log(`[VOICE] ${member.user.tag} đã chuyển voice channel sau ${Math.floor(timeSpent / 60000)} phút`);
      }
    }
  }
};

