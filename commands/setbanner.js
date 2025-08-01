const { SlashCommandBuilder } = require('discord.js');
const { saveJSON } = require('../utils/database');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbanner')
    .setDescription('🔧 Chỉ Owner dùng để đổi banner cho embeds')
    .addStringOption(option =>
      option.setName('banner')
        .setDescription('URL của banner bạn muốn sử dụng')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User cụ thể (để trống để đổi banner mặc định)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.editReply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.'
      });
    }

    const bannerUrl = interaction.options.getString('banner');
    const targetUser = interaction.options.getUser('user');

    // Validate URL
    try {
      new URL(bannerUrl);
    } catch (error) {
      return interaction.editReply({
        content: '❌ URL không hợp lệ. Vui lòng nhập một URL hợp lệ.'
      });
    }

    if (targetUser) {
      // Set banner for specific user
      embedConfig.setUserBanner(targetUser.id, bannerUrl);
      await interaction.editReply({
        content: `✅ Đã thay đổi banner cho ${targetUser.tag} thành: ${bannerUrl}`
      });
    } else {
      // Update the default banner
      embedConfig.defaultBanner = bannerUrl;
      await interaction.editReply({
        content: `✅ Đã thay đổi banner mặc định thành: ${bannerUrl}`
      });
    }
  }
}; 