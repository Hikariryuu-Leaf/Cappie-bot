const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { getEmoji } = require('../utils/emoji');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topcartridge')
    .setDescription('Hiển thị top 10 người dùng có nhiều Cartridge nhất'),

  async execute(interaction) {
    const users = loadJSON(userDataPath);

    const sorted = Object.entries(users)
      .filter(([_, data]) => (data.cartridge || 0) > 0)
      .sort((a, b) => (b[1].cartridge || 0) - (a[1].cartridge || 0))
      .slice(0, 10);

    if (sorted.length === 0) {
      return interaction.reply({
        content: '❌ Không có người dùng nào có Cartridge.',
        flags: 64 // Ephemeral flag
      });
    }

    const emoji = getEmoji();

    const embed = new EmbedBuilder()
      .setTitle(`${embedConfig.emojis.top.cartridge} Top 10 Cartridge`)
      .setColor(embedConfig.colors.top)
      .setThumbnail(embedConfig.getBanner(interaction.user.id))
      .setImage(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();

    let rank = 1;
    for (const [userId, data] of sorted) {
      embed.addFields({
        name: `${embedConfig.emojis.top.rank}${rank} - <@${userId}>`,
        value: `${emoji} ${data.cartridge || 0} Cartridge`,
        inline: false
      });
      rank++;
    }

    await interaction.reply({ embeds: [embed] }); // Public embed
  }
};
