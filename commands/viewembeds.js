const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewembeds')
    .setDescription('🔧 Chỉ Owner dùng để xem cài đặt embed hiện tại'),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.',
        flags: 64 // Ephemeral flag
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎨 Cài đặt Embed hiện tại')
      .setColor(embedConfig.colors.info)
      .setThumbnail(embedConfig.defaultBanner)
      .addFields(
        { name: '📷 Banner mặc định', value: embedConfig.defaultBanner, inline: false },
        { name: '👥 Banner tùy chỉnh', value: Object.keys(embedConfig.userBanners).length > 0 ? `${Object.keys(embedConfig.userBanners).length} user có banner tùy chỉnh` : 'Không có', inline: false },
        { name: '🎨 Màu sắc', value: Object.entries(embedConfig.colors).map(([key, value]) => `${key}: #${value.toString(16).padStart(6, '0')}`).join('\n'), inline: false },
        { name: '😊 Emojis', value: 'Sử dụng `/setembedemoji` để xem và thay đổi emojis', inline: false }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: 64 // Ephemeral flag
    });
  }
}; 