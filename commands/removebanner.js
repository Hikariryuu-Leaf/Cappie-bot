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
      return interaction.editReply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.'
      });
    }

    const targetUser = interaction.options.getUser('user');

    // Check if user has a custom banner
    if (!embedConfig.userBanners[targetUser.id]) {
      return interaction.editReply({
        content: `❌ ${targetUser.tag} không có banner tùy chỉnh.`
      });
    }

    // Remove the user's custom banner
    embedConfig.removeUserBanner(targetUser.id);

    await interaction.editReply({
      content: `✅ Đã xóa banner tùy chỉnh của ${targetUser.tag}. Họ sẽ sử dụng banner mặc định.`
    });
  }
}; 