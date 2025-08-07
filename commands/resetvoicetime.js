const { SlashCommandBuilder } = require('discord.js');
const { loadUser, saveUser } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetvoicetime')
    .setDescription('Reset voice time của bạn về 0'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      let user = await loadUser(userId);
      user.totalVoice = 0;
      await saveUser(user);
      await safeEditReply(interaction, {
        content: '✅ Đã reset voice time của bạn về 0.'
      });
    } catch (error) {
      console.error('Lỗi trong execute resetvoicetime:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh reset voice time.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};