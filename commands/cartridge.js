const { SlashCommandBuilder } = require('discord.js');
const { loadUser, saveUser } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cartridge')
    .setDescription('Quản lý cartridge của bạn')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số lượng cartridge muốn cộng/trừ')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const amount = interaction.options.getInteger('amount');
      let user = await loadUser(userId);
      user.cartridge = (user.cartridge || 0) + amount;
      if (user.cartridge < 0) user.cartridge = 0;
      await saveUser(user);
      await safeEditReply(interaction, {
        content: `✅ Số cartridge hiện tại của bạn: **${user.cartridge}**`
      });
    } catch (error) {
      console.error('Lỗi trong execute cartridge:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh cartridge.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 