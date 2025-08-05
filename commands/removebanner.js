const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removebanner')
    .setDescription('🔧 Chỉ Owner dùng để xóa banner của user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn xóa banner')
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

      const user = interaction.options.getUser('user');

      if (!embedConfig.userBanners[user.id]) {
        return interaction.editReply({
          content: '❌ User này không có banner tùy chỉnh.'
        });
      }

      // Remove the banner
      delete embedConfig.userBanners[user.id];
      
      await interaction.editReply({
        content: `✅ Đã xóa banner của ${user.username}.`
      });
    } catch (error) {
      console.error('Lỗi trong removebanner:', error);
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