const { Events } = require('discord.js');
const { loadUser, saveUser } = require('../utils/database');
const { formatVoiceTime } = require('../utils/voiceTimeFormatter');

module.exports = {
  name: Events.VoiceStateUpdate,
  
  async execute(oldState, newState) {
    const member = newState.member;
    const userId = member.id;

    // Bỏ qua bot
    if (member.user.bot) return;

    // Lấy user từ MongoDB
    let user = await loadUser(userId);

    // JOINED voice channel
    if (!oldState.channelId && newState.channelId) {
      user.joinTime = Date.now();
      await saveUser(user);
      console.log(`[VOICE] ${member.user.tag} joined voice channel: ${newState.channel.name}`);
    }

    // LEFT voice channel
    else if (oldState.channelId && !newState.channelId) {
      if (typeof user.joinTime === 'number' && user.joinTime > 0) {
        const timeSpent = Date.now() - user.joinTime;
        user.totalVoice = (user.totalVoice || 0) + timeSpent;
        user.joinTime = null;
        await saveUser(user);

        const formattedTime = formatVoiceTime(timeSpent);
        console.log(`[VOICE] ${member.user.tag} left voice channel after ${formattedTime}`);
      }
    }

    // MOVED between voice channels
    else if (oldState.channelId !== newState.channelId && oldState.channelId && newState.channelId) {
      if (typeof user.joinTime === 'number' && user.joinTime > 0) {
        const timeSpent = Date.now() - user.joinTime;
        user.totalVoice = (user.totalVoice || 0) + timeSpent;
        user.joinTime = Date.now(); // Reset timer for new channel
        await saveUser(user);

        const formattedTime = formatVoiceTime(timeSpent);
        console.log(`[VOICE] ${member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name} after ${formattedTime}`);
      }
    }
  }
};

