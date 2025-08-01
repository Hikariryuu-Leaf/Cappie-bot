const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { formatTime } = require('../utils/formatTime');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topvoice')
    .setDescription('Hiển thị top 10 người dùng voice nhiều nhất'),

  async execute(interaction) {
    const users = loadJSON(userDataPath);

    // Sắp xếp theo voice giảm dần
    const sorted = Object.entries(users)
      .filter(([_, data]) => (data.totalVoice || 0) > 0)
      .sort((a, b) => (b[1].totalVoice || 0) - (a[1].totalVoice || 0))
      .slice(0, 10);

    if (sorted.length === 0) {
      return interaction.reply({
        content: '❌ Không có dữ liệu voice nào.',
        flags: 64 // Ephemeral flag
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${embedConfig.emojis.top.voice} Top 10 Voice Time`)
      .setColor(embedConfig.colors.voice)
      .setThumbnail(embedConfig.defaultBanner)
      .setTimestamp();

    let rank = 1;
    for (const [userId, data] of sorted) {
      const voiceTimeFormatted = formatTime(data.totalVoice || 0);
      embed.addFields({
        name: `${embedConfig.emojis.top.rank}${rank} - <@${userId}>`,
        value: `${embedConfig.emojis.profile.voice} ${voiceTimeFormatted}`,
        inline: false
      });
      rank++;
    }

    await interaction.reply({ embeds: [embed], flags: 64 }); // Ephemeral flag
  }
};
