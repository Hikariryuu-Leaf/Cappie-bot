const { SlashCommandBuilder } = require('discord.js');
const { saveJSON } = require('../utils/database');
const { emojiPath } = require('../config');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setemoji')
    .setDescription('🔧 Chỉ Owner dùng để đổi emoji mặc định cho embed')
    .addStringOption(option =>
      option.setName('default_emoji')
        .setDescription('Emoji mặc định hiện tại (hiển thị trực tiếp)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('replacement_emoji')
        .setDescription('Emoji thay thế từ server')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.',
        flags: 64 // Ephemeral flag
      });
    }

    const defaultEmoji = interaction.options.getString('default_emoji');
    const replacementEmoji = interaction.options.getString('replacement_emoji');

    // Validate that the replacement emoji is from the server
    const guild = interaction.guild;
    const serverEmojis = guild.emojis.cache;
    
    // Check if the replacement emoji is a custom server emoji
    const isCustomEmoji = replacementEmoji.match(/<a?:.+?:\d+>/);
    if (isCustomEmoji) {
      const emojiId = replacementEmoji.match(/\d+/)[0];
      const emoji = serverEmojis.get(emojiId);
      if (!emoji) {
        return interaction.reply({
          content: '❌ Emoji thay thế phải là emoji từ server này.',
          flags: 64 // Ephemeral flag
        });
      }
    }

    // Save the new emoji configuration
    saveJSON(emojiPath, { 
      emoji: replacementEmoji,
      defaultEmoji: defaultEmoji 
    });

    await interaction.reply({
      content: `✅ Đã thay đổi emoji từ ${defaultEmoji} thành ${replacementEmoji}`,
      flags: 64 // Ephemeral flag
    });
  }
};

