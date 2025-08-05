const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('setembedcolor')
    .setDescription('🔧 Chỉ Owner dùng để đổi màu cho các phần khác nhau của embed')
    .addStringOption(option =>
      option.setName('section')
        .setDescription('Phần màu muốn thay đổi')
        .setRequired(true)
        .addChoices(
          { name: 'Success', value: 'success' },
          { name: 'Error', value: 'error' },
          { name: 'Info', value: 'info' },
          { name: 'Warning', value: 'warning' },
          { name: 'Top', value: 'top' },
          { name: 'Voice', value: 'voice' },
          { name: 'Profile', value: 'profile' },
          { name: 'Shop', value: 'shop' }
        )
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Màu mới (hex code, ví dụ: #ff0000)')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Defer the interaction immediately to prevent timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }
      
      const ownerId = process.env.OWNER_ID;
      if (interaction.user.id !== ownerId) {
        return interaction.editReply({
          content: '❌ Bạn không có quyền sử dụng lệnh này.'
        });
      }

      const section = interaction.options.getString('section');
      const color = interaction.options.getString('color');

      // Validate hex color format
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(color)) {
        return interaction.editReply({
          content: '❌ Màu không hợp lệ. Vui lòng sử dụng định dạng hex (ví dụ: #ff0000).'
        });
      }

      // Update the specific color in the config
      if (embedConfig.colors[section]) {
        embedConfig.colors[section] = color;
        
        await interaction.editReply({
          content: `✅ Đã thay đổi màu cho ${section} thành: ${color}`
        });
      } else {
        await interaction.editReply({
          content: '❌ Phần màu không tồn tại.'
        });
      }
    } catch (error) {
      console.error('Lỗi trong setembedcolor:', error);
      try {
        await interaction.editReply({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};