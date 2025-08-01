const { SlashCommandBuilder } = require('discord.js');
const { saveJSON } = require('../utils/database');
const { emojiPath } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setemoji')
    .setDescription('🔧 Chỉ Owner dùng để đổi emoji mặc định cho embed')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji bạn muốn sử dụng (ví dụ: 🧩)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này.',
        ephemeral: true
      });
    }

    const emoji = interaction.options.getString('emoji');

    saveJSON(emojiPath, { emoji });

    await interaction.reply({
      content: `✅ Đã thay đổi emoji mặc định thành: ${emoji}`,
      ephemeral: true
    });
  }
};

