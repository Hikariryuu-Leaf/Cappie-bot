const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { shopDataPath } = require('../config');
const config = require('../config');

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
      return interaction.reply({ 
        content: '❌ Bạn không có quyền sử dụng lệnh này.', 
        flags: 64 // Ephemeral flag
      });
    }

    const ten = interaction.options.getString('ten');
    const gia = interaction.options.getInteger('gia');

    try {
      const shop = loadJSON(shopDataPath);
      shop[ten] = gia;
      saveJSON(shopDataPath, shop);

      await interaction.reply({
        content: `✅ Đã cập nhật phần quà **${ten}** với giá **${gia}** Cartridge.`,
        flags: 64 // Ephemeral flag
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật shop:', error);
      await interaction.reply({
        content: '❌ Đã xảy ra lỗi khi cập nhật shop.',
        flags: 64 // Ephemeral flag
      });
    }
  }
};

