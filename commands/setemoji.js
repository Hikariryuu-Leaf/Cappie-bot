const { SlashCommandBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { emojiPath } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setemoji')
    .setDescription('🔧 Chỉ Owner dùng để đổi emoji mặc định')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji mới')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      
      
      const ownerId = process.env.OWNER_ID;
      if (interaction.user.id !== ownerId) {
        return interaction.editReply({
          content: '❌ Bạn không có quyền sử dụng lệnh này.'
        });
      }

      const newEmoji = interaction.options.getString('emoji');
      
      // Validate emoji format
      const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
      
      if (!emojiRegex.test(newEmoji)) {
        return interaction.editReply({
          content: '❌ Emoji không hợp lệ. Vui lòng sử dụng emoji Unicode.'
        });
      }

      try {
        const emojiData = loadJSON(emojiPath);
        emojiData.emoji = newEmoji;
        saveJSON(emojiPath, emojiData);
        
        await safeEditReply(interaction({
          content: `✅ Đã thay đổi emoji mặc định thành: ${newEmoji}`
        });
      } catch (error) {
        await safeEditReply(interaction({
          content: '❌ Có lỗi xảy ra khi lưu emoji.'
        });
      }
    } catch (error) {
      console.error('Lỗi trong setemoji:', error);
      try {
        await safeEditReply(interaction({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};

