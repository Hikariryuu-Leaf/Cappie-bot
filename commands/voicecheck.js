const { SlashCommandBuilder } = require('discord.js');
const { loadUser } = require('../utils/database');
const { formatTime } = require('../utils/formatTime');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicecheck')
    .setDescription('Kiểm tra tổng thời gian voice của bạn'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = await loadUser(userId);
      let totalVoice = user.totalVoice || 0;
      if (user.joinTime && typeof user.joinTime === 'number' && user.joinTime > 0) {
        totalVoice += Date.now() - user.joinTime;
      }
      const totalVoiceMinutes = Math.floor(totalVoice / 60000);
      const voiceTimeFormatted = formatTime(totalVoiceMinutes);
      await safeEditReply(interaction, {
        content: `⏱️ Tổng thời gian voice của bạn: **${voiceTimeFormatted}**`
      });
    } catch (error) {
      console.error('Lỗi trong execute voicecheck:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi kiểm tra voice time.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 