const { SlashCommandBuilder } = require('discord.js');
const { loadUser, saveUser, loadEmojis } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');

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
        return await safeEditReply(interaction, {
          content: `❌ Bạn đã điểm danh hôm nay rồi! Hãy quay lại sau.`
        });
      }
      user.lastClaim = now;
      user.cartridge = (user.cartridge || 0) + 10; // Thưởng 10 cartridge
      await saveUser(user);
      await safeEditReply(interaction, {
        content: `✅ Điểm danh thành công! Bạn nhận được 10 ${emoji}. Tổng cartridge: **${user.cartridge}**`
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
