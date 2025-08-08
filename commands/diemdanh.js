const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUser, saveUser, loadEmojis } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');
const embedConfig = require('../config/embeds');
const { formatMilliseconds } = require('../utils/formatTime');

// Helper function to check if server has active boost
function hasServerBoost(guild) {
  return guild.premiumSubscriptionCount > 0;
}

// Helper function to generate random cartridge amount
function getRandomCartridgeAmount(hasBoost) {
  const min = 1;
  const max = hasBoost ? 200 : 100;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diemdanh')
    .setDescription('Điểm danh nhận thưởng mỗi ngày'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      let user = await loadUser(userId);
      const emojis = await loadEmojis();
      const emoji = (emojis && emojis.length > 0) ? emojis[0].emoji : '🎁';
      // Logic điểm danh
      const now = Date.now();
      const lastClaim = user.lastClaim || 0;
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastClaim < oneDay) {
        const timeLeft = oneDay - (now - lastClaim);
        const embed = new EmbedBuilder()
          .setTitle(`${embedConfig.emojis.diemdanh.cooldown} Cooldown điểm danh`)
          .setColor(embedConfig.colors.warning)
          .setDescription(`❌ Bạn đã điểm danh hôm nay rồi!\n\n⏳ Thời gian chờ còn lại: **${formatMilliseconds(timeLeft)}**`)
          .setTimestamp();
        return await safeEditReply(interaction, { embeds: [embed] });
      }
      // Check if server has boost and calculate random reward
      const guild = interaction.guild;
      const hasBoost = hasServerBoost(guild);
      const cartridgeReward = getRandomCartridgeAmount(hasBoost);

      user.lastClaim = now;
      user.cartridge = (user.cartridge || 0) + cartridgeReward;
      await saveUser(user);

      // Create enhanced success embed with boost info and proper emoji
      const successEmbed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.diemdanh.success} Điểm danh thành công!`)
        .setColor(embedConfig.colors.success)
        .setDescription(`Bạn đã nhận được phần thưởng điểm danh hôm nay!`)
        .addFields(
          {
            name: `${embedConfig.emojis.diemdanh.reward} Phần thưởng nhận được`,
            value: `**${cartridgeReward}** ${emoji}`,
            inline: true
          },
          {
            name: `${embedConfig.emojis.diemdanh.total} Tổng Cartridge`,
            value: `**${user.cartridge}** ${emoji}`,
            inline: true
          },
          {
            name: hasBoost ? `${embedConfig.emojis.diemdanh.nitro} Server Boost` : '📦 Reward Range',
            value: hasBoost ? 'Active! (1-200 range)' : 'Standard (1-100 range)',
            inline: true
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: 'Quay lại vào ngày mai để nhận thưởng tiếp!' })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });
    } catch (error) {
      console.error('Lỗi trong execute diemdanh:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh điểm danh.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
