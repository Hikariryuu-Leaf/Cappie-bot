const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadShop, saveShop } = require('../utils/database');
const config = require('../config');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setshop')
    .setDescription('Chỉnh sửa phần quà và giá Cartridge')
    .addStringOption(option =>
      option.setName('ten')
        .setDescription('Tên phần quà')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('gia')
        .setDescription('Giá cartridge')
        .setMinValue(1)
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      return await safeEditReply(interaction, { 
        content: '❌ Bạn không có quyền sử dụng lệnh này.'
      });
    }

    const ten = interaction.options.getString('ten');
    const gia = interaction.options.getInteger('gia');

    try {
      let shop = await loadShop();
      // Nếu shop rỗng, tạo mới
      if (!Array.isArray(shop)) shop = [];
      // Tìm item theo tên
      let item = shop.find(i => i.name === ten);
      if (item) {
        item.price = gia;
      } else {
        shop.push({ name: ten, price: gia, itemId: ten });
      }
      await saveShop(shop);

      await safeEditReply(interaction, {
        content: `✅ Đã cập nhật phần quà **${ten}** với giá **${gia}** Cartridge.`
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật shop:', error);
      await safeEditReply(interaction, {
        content: '❌ Đã xảy ra lỗi khi cập nhật shop.'
      });
    }
  }
};
