const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removebanner')
    .setDescription('🔧 Chỉ Owner dùng để xóa banner tùy chỉnh của user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn xóa banner tùy chỉnh')
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

    // Check if user has a custom banner
    if (!embedConfig.userBanners[targetUser.id]) {
      return interaction.reply({
        content: `❌ ${targetUser.tag} không có banner tùy chỉnh.`,
        flags: 64 // Ephemeral flag
      });
    }

    // Remove the user's custom banner
    embedConfig.removeUserBanner(targetUser.id);

    await interaction.reply({
      content: `✅ Đã xóa banner tùy chỉnh của ${targetUser.tag}. Họ sẽ sử dụng banner mặc định.`,
      flags: 64 // Ephemeral flag
    });
  }
}; 