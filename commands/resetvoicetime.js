const { SlashCommandBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetvoicetime')
    .setDescription('🔧 Chỉ Owner dùng để reset voice time cho user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn reset voice time')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.',
        flags: 64 // Ephemeral flag
      });
    }

    const targetUser = interaction.options.getUser('user');
    const users = loadJSON(userDataPath);

    if (!users[targetUser.id]) {
      return interaction.reply({
        content: '❌ User này chưa có dữ liệu.',
        flags: 64 // Ephemeral flag
      });
    }

    // Reset voice time
    users[targetUser.id].voiceTime = 0;
    users[targetUser.id].totalVoice = 0;
    saveJSON(userDataPath, users);

    await interaction.reply({
      content: `✅ Đã reset voice time cho ${targetUser.tag}`,
      flags: 64 // Ephemeral flag
    });
  }
}; 