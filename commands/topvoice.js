const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadAllUsers } = require('../utils/database');
const { formatTime } = require('../utils/formatTime');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topvoice')
    .setDescription('Hiển thị top 10 người dùng voice nhiều nhất'),

  async execute(interaction) {
    try {
      const users = await loadAllUsers();
      const sorted = users
        .filter(u => (u.totalVoice || 0) > 0)
        .sort((a, b) => (b.totalVoice || 0) - (a.totalVoice || 0))
        .slice(0, 10);

      if (sorted.length === 0) {
        return interaction.editReply({
          content: '❌ Không có dữ liệu voice nào.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.top.voice} Top 10 Voice Time`)
        .setColor(embedConfig.colors.voice)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setImage(embedConfig.getBanner(interaction.user.id))
        .setTimestamp();

      let rank = 1;
      for (const user of sorted) {
        try {
          // Add timeout for user fetch
          const userPromise = interaction.client.users.fetch(user.userId);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('User fetch timeout')), 3000);
          });
          const discordUser = await Promise.race([userPromise, timeoutPromise]);
          const username = discordUser.username;
          const voiceTimeFormatted = formatTime(Math.floor((user.totalVoice || 0) / 60000));
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @${username}`,
            value: `${embedConfig.emojis.profile.voice} ${voiceTimeFormatted}`,
            inline: false
          });
        } catch (error) {
          const voiceTimeFormatted = formatTime(Math.floor((user.totalVoice || 0) / 60000));
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @unknown_user`,
            value: `${embedConfig.emojis.profile.voice} ${voiceTimeFormatted}`,
            inline: false
          });
        }
        rank++;
      }

      await safeEditReply(interaction, { 
        embeds: [embed]
      });
    } catch (error) {
      console.error('Lỗi trong execute topvoice:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh topvoice.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
