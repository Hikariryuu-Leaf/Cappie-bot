const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUser } = require('../utils/database');
const { formatTime } = require('../utils/formatTime');
const { formatVoiceTime, getTotalVoiceTime, getCurrentSessionDuration } = require('../utils/voiceTimeFormatter');
const { safeEditReply } = require('../utils/interactionHelper');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicecheck')
    .setDescription('Kiểm tra tổng thời gian voice của bạn'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = await loadUser(userId);

      // Enhanced voice time calculation
      const totalVoiceTime = getTotalVoiceTime(user.totalVoice, user.joinTime);
      const currentSessionTime = getCurrentSessionDuration(user.joinTime);
      const isInVoice = user.joinTime && typeof user.joinTime === 'number' && user.joinTime > 0;

      // Format voice times
      const totalVoiceFormatted = formatVoiceTime(totalVoiceTime);
      const currentSessionFormatted = isInVoice ? formatVoiceTime(currentSessionTime) : null;

      const embed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.profile.voice} Voice Time Check`)
        .setColor(embedConfig.colors.voice)
        .setDescription(`Voice time statistics for ${interaction.user.username}`)
        .addFields(
          { name: '⏱️ Total Voice Time', value: `**${totalVoiceFormatted}**`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      // Add current session info if user is in voice
      if (isInVoice && currentSessionFormatted) {
        embed.addFields({
          name: '🎙️ Current Session',
          value: `**${currentSessionFormatted}** (ongoing)`,
          inline: false
        });
        embed.setFooter({ text: 'You are currently in a voice channel!' });
      } else {
        embed.setFooter({ text: 'Join a voice channel to start earning Cartridges!' });
      }

      await safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('Lỗi trong execute voicecheck:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi kiểm tra voice time.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 