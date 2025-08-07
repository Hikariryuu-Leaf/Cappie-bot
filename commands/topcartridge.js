const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadAllUsers } = require('../utils/database');
const { getEmoji } = require('../utils/emoji');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topcartridge')
    .setDescription('Hiển thị top 10 người dùng có nhiều Cartridge nhất'),

  async execute(interaction) {
    try {
      const users = await loadAllUsers();
      const sorted = users
        .filter(u => (u.cartridge || 0) > 0)
        .sort((a, b) => (b.cartridge || 0) - (a.cartridge || 0))
        .slice(0, 10);

      if (sorted.length === 0) {
        return interaction.editReply({
          content: '❌ Không có người dùng nào có Cartridge.'
        });
      }

      const emoji = getEmoji();
      const embed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.top.cartridge} Top 10 Cartridge`)
        .setColor(embedConfig.colors.top)
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
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @${username}`,
            value: `${emoji} ${user.cartridge || 0} Cartridge`,
            inline: false
          });
        } catch (error) {
          embed.addFields({
            name: `${embedConfig.emojis.top.rank}${rank} - @unknown_user`,
            value: `${emoji} ${user.cartridge || 0} Cartridge`,
            inline: false
          });
        }
        rank++;
      }

      await safeEditReply(interaction, { 
        embeds: [embed]
      });
    } catch (error) {
      console.error('Lỗi trong execute topcartridge:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh topcartridge.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
