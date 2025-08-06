const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbanner')
    .setDescription('🔧 Chỉ Owner dùng để đặt banner cho user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User muốn đặt banner')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('banner_url')
        .setDescription('URL của banner')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      
      
      const ownerId = process.env.OWNER_ID;
      if (interaction.user.id !== ownerId) {
        return interaction.editReply({
          content: '❌ Bạn không có quyền sử dụng lệnh này.'
        });
      }

      const user = interaction.options.getUser('user');
      const bannerUrl = interaction.options.getString('banner_url');

      // Validate URL format
      try {
        new URL(bannerUrl);
      } catch (error) {
        return interaction.editReply({
          content: '❌ URL không hợp lệ.'
        });
      }

      // Set the banner for the user
      embedConfig.userBanners[user.id] = bannerUrl;
      
      await safeEditReply(interaction({
        content: `✅ Đã đặt banner cho ${user.username}: ${bannerUrl}`
      });
    } catch (error) {
      console.error('Lỗi trong setbanner:', error);
      try {
        await safeEditReply(interaction({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 