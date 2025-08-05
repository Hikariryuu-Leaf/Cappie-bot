const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewembeds')
    .setDescription('🔧 Chỉ Owner dùng để xem cấu hình embed hiện tại'),

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

      const embed = new EmbedBuilder()
        .setTitle('🔧 Cấu Hình Embed Hiện Tại')
        .setColor('#0099ff')
        .addFields(
          { name: '🎨 Colors', value: `**Success:** ${embedConfig.colors.success}\n**Error:** ${embedConfig.colors.error}\n**Info:** ${embedConfig.colors.info}\n**Warning:** ${embedConfig.colors.warning}`, inline: false },
          { name: '📊 Emojis', value: `**Diemdanh Success:** ${embedConfig.emojis.diemdanh.success}\n**Diemdanh Reward:** ${embedConfig.emojis.diemdanh.reward}\n**Profile Cartridge:** ${embedConfig.emojis.profile.cartridge}\n**Top Rank:** ${embedConfig.emojis.top.rank}`, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi trong viewembeds:', error);
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