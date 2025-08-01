const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { getEmoji } = require('../utils/emoji');

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
        ephemeral: true
      });
    }

    const emoji = getEmoji();

    const embed = new EmbedBuilder()
      .setTitle(`💰 Top 10 Cartridge`)
      .setColor(0xf1c40f)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    let rank = 1;
    for (const [userId, data] of sorted) {
      embed.addFields({
        name: `#${rank} - <@${userId}>`,
        value: `${emoji} ${data.cartridge || 0} Cartridge`,
        inline: false
      });
      rank++;
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
