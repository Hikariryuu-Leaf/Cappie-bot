const { Events } = require('discord.js');
const { loadUser, saveUser } = require('../utils/database');

module.exports = {
  name: Events.VoiceStateUpdate,
  
  async execute(oldState, newState) {
    const member = newState.member;
    const userId = member.id;

    // Bỏ qua bot
    if (member.user.bot) return;

    // Lấy user từ MongoDB
    let user = await loadUser(userId);

    // THAM GIA voice
    if (!oldState.channelId && newState.channelId) {
      user.joinTime = Date.now();
      await saveUser(user);
      console.log(`[VOICE] ${member.user.tag} đã tham gia voice channel`);
    }

    // RỜI KHỎI voice
    else if (oldState.channelId && !newState.channelId) {
      if (user.joinTime) {
        const timeSpent = Date.now() - user.joinTime;
        user.totalVoice = (user.totalVoice || 0) + timeSpent;
        user.joinTime = undefined;
        await saveUser(user);
        console.log(`[VOICE] ${member.user.tag} đã rời voice channel sau ${Math.floor(timeSpent / 60000)} phút`);
      }
    }

    // DI CHUYỂN GIỮA CÁC KÊNH voice
    else if (oldState.channelId !== newState.channelId) {
      if (user.joinTime) {
        const timeSpent = Date.now() - user.joinTime;
        user.totalVoice = (user.totalVoice || 0) + timeSpent;
        user.joinTime = Date.now();
        await saveUser(user);
        console.log(`[VOICE] ${member.user.tag} đã chuyển voice channel sau ${Math.floor(timeSpent / 60000)} phút`);
      }
    }
  }
};

