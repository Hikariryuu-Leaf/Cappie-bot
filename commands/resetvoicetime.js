const { SlashCommandBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetvoicetime')
    .setDescription('🔧 Chỉ Owner dùng để reset voice time của user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn reset voice time')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Defer the interaction immediately to prevent timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }
      
      const ownerId = process.env.OWNER_ID;
      if (interaction.user.id !== ownerId) {
        return interaction.editReply({
          content: '❌ Bạn không có quyền sử dụng lệnh này.'
        });
      }

      const targetUser = interaction.options.getUser('user');
      const users = loadJSON(userDataPath);

      if (!users[targetUser.id]) {
        return interaction.editReply({
          content: '❌ User này chưa có dữ liệu voice time.'
        });
      }

      // Reset voice time
      users[targetUser.id].voiceTime = 0;
      users[targetUser.id].totalVoice = 0;
      saveJSON(userDataPath, users);

      await interaction.editReply({
        content: `✅ Đã reset voice time cho ${targetUser.username}.`
      });
    } catch (error) {
      console.error('Lỗi trong resetvoicetime:', error);
      try {
        await interaction.editReply({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};