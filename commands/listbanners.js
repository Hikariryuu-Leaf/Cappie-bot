const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listbanners')
    .setDescription('🔧 Chỉ Owner dùng để xem danh sách banner tùy chỉnh'),

  async execute(interaction) {
    try {
      
      
      const ownerId = process.env.OWNER_ID;
      if (interaction.user.id !== ownerId) {
        return interaction.editReply({
          content: '❌ Bạn không có quyền sử dụng lệnh này.'
        });
      }

      const customBanners = Object.keys(embedConfig.userBanners);
      
      if (customBanners.length === 0) {
        return interaction.editReply({
          content: '📂 Không có banner tùy chỉnh nào.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Danh Sách Banner Tùy Chỉnh')
        .setColor('#0099ff')
        .setDescription(`Tìm thấy **${customBanners.length}** banner tùy chỉnh`)
        .setTimestamp();

      for (const userId of customBanners) {
        try {
          const user = await interaction.client.users.fetch(userId);
          embed.addFields({
            name: `👤 ${user.username}`,
            value: `**Banner:** ${embedConfig.userBanners[userId]}`,
            inline: false
          });
        } catch (error) {
          embed.addFields({
            name: `👤 User ${userId}`,
            value: `**Banner:** ${embedConfig.userBanners[userId]}\n*User không tìm thấy*`,
            inline: false
          });
        }
      }

      await safeEditReply(interaction({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi trong listbanners:', error);
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