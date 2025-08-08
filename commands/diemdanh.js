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

      // Create enhanced success message with boost info
      const boostInfo = hasBoost ? `\n🚀 **Server Boost Active!** Increased reward range (1-200)` : `\n📦 Standard reward range (1-100)`;

      await safeEditReply(interaction, {
        content: `✅ Điểm danh thành công! Bạn nhận được **${cartridgeReward}** ${emoji}.${boostInfo}\n💰 Tổng cartridge: **${user.cartridge}**`
      });
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
