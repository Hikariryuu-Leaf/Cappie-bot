const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listbanners')
    .setDescription('🔧 Chỉ Owner dùng để xem danh sách banner tùy chỉnh'),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.editReply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.'
      });
    }

    const userBanners = embedConfig.userBanners;
    const bannerCount = Object.keys(userBanners).length;

    if (bannerCount === 0) {
      return interaction.editReply({
        content: '📋 Không có banner tùy chỉnh nào được thiết lập.'
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Danh sách Banner tùy chỉnh')
      .setColor(embedConfig.colors.info)
      .setDescription(`Tổng cộng: ${bannerCount} banner tùy chỉnh`)
      .addFields(
        { name: '🎨 Banner mặc định', value: embedConfig.defaultBanner, inline: false }
      );

    // Add user banners
    for (const [userId, bannerUrl] of Object.entries(userBanners)) {
      try {
        const user = await interaction.client.users.fetch(userId);
        embed.addFields({
          name: `👤 ${user.tag}`,
          value: bannerUrl,
          inline: false
        });
      } catch (error) {
        embed.addFields({
          name: `👤 User ID: ${userId}`,
          value: bannerUrl,
          inline: false
        });
      }
    }

    await interaction.editReply({
      embeds: [embed]
    });
  }
}; 