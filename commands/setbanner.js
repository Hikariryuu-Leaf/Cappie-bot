const { SlashCommandBuilder } = require('discord.js');
const { saveJSON } = require('../utils/database');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbanner')
    .setDescription('🔧 Chỉ Owner dùng để đổi banner mặc định cho embeds')
    .addStringOption(option =>
      option.setName('banner')
        .setDescription('URL của banner bạn muốn sử dụng')
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

    const bannerUrl = interaction.options.getString('banner');

    // Validate URL
    try {
      new URL(bannerUrl);
    } catch (error) {
      return interaction.reply({
        content: '❌ URL không hợp lệ. Vui lòng nhập một URL hợp lệ.',
        flags: 64 // Ephemeral flag
      });
    }

    // Update the embed config
    embedConfig.defaultBanner = bannerUrl;

    await interaction.reply({
      content: `✅ Đã thay đổi banner mặc định thành: ${bannerUrl}`,
      flags: 64 // Ephemeral flag
    });
  }
}; 