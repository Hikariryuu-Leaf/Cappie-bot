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
      return interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.',
        flags: 64 // Ephemeral flag
      });
    }

    const bannerUrl = interaction.options.getString('banner');
    const targetUser = interaction.options.getUser('user');

    // Validate URL
    try {
      new URL(bannerUrl);
    } catch (error) {
      return interaction.reply({
        content: '❌ URL không hợp lệ. Vui lòng nhập một URL hợp lệ.',
        flags: 64 // Ephemeral flag
      });
    }

    if (targetUser) {
      // Set banner for specific user
      embedConfig.setUserBanner(targetUser.id, bannerUrl);
      await interaction.reply({
        content: `✅ Đã thay đổi banner cho ${targetUser.tag} thành: ${bannerUrl}`,
        flags: 64 // Ephemeral flag
      });
    } else {
      // Update the default banner
      embedConfig.defaultBanner = bannerUrl;
      await interaction.reply({
        content: `✅ Đã thay đổi banner mặc định thành: ${bannerUrl}`,
        flags: 64 // Ephemeral flag
      });
    }
  }
}; 