const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { formatTime } = require('../utils/formatTime');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topvoice')
    .setDescription('Hiển thị top 10 người dùng voice nhiều nhất'),

  async execute(interaction) {
    try {
      

      const users = loadJSON(userDataPath);

      // Sắp xếp theo voice giảm dần
      const sorted = Object.entries(users)
        .filter(([_, data]) => (data.totalVoice || 0) > 0)
        .sort((a, b) => (b[1].totalVoice || 0) - (a[1].totalVoice || 0))
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
      for (const [userId, data] of sorted) {
        try {
          // Add timeout for user fetch
          const userPromise = interaction.client.users.fetch(userId);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('User fetch timeout')), 3000);
          });
          
          const user = await Promise.race([userPromise, timeoutPromise]);
          const username = user.username;
          const voiceTimeFormatted = formatTime(data.totalVoice || 0);
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @${username}`,
            value: `${embedConfig.emojis.profile.voice} ${voiceTimeFormatted}`,
            inline: false
          });
        } catch (error) {
          // If user not found, use userId as fallback
          const voiceTimeFormatted = formatTime(data.totalVoice || 0);
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @unknown_user`,
            value: `${embedConfig.emojis.profile.voice} ${voiceTimeFormatted}`,
            inline: false
          });
        }
        rank++;
      }

      await safeEditReply(interaction({ 
        embeds: [embed]
      });
    } catch (error) {
      console.error('Lỗi trong execute topvoice:', error);
      try {
        await safeEditReply(interaction({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh topvoice.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
