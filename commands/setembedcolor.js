const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setembedcolor')
    .setDescription('🔧 Chỉ Owner dùng để đổi màu cho các embed')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại embed muốn thay đổi màu')
        .setRequired(true)
        .addChoices(
          { name: 'Success', value: 'success' },
          { name: 'Info', value: 'info' },
          { name: 'Warning', value: 'warning' },
          { name: 'Error', value: 'error' },
          { name: 'Shop', value: 'shop' },
          { name: 'Profile', value: 'profile' },
          { name: 'Top', value: 'top' },
          { name: 'Voice', value: 'voice' }
        )
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Màu hex (ví dụ: #00ff99)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.editReply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.'
      });
    }

    const type = interaction.options.getString('type');
    const colorHex = interaction.options.getString('color');

    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(colorHex)) {
      return interaction.editReply({
        content: '❌ Màu hex không hợp lệ. Vui lòng sử dụng định dạng #RRGGBB.'
      });
    }

    // Convert hex to decimal
    const colorDecimal = parseInt(colorHex.replace('#', ''), 16);

    // Update the color in the config
    if (embedConfig.colors[type] !== undefined) {
      embedConfig.colors[type] = colorDecimal;
      
      await interaction.editReply({
        content: `✅ Đã thay đổi màu cho ${type} thành: ${colorHex}`
      });
    } else {
      await interaction.editReply({
        content: '❌ Loại màu không tồn tại.'
      });
    }
  }
}; 