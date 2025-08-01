const { SlashCommandBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setembedemoji')
    .setDescription('🔧 Chỉ Owner dùng để đổi emoji cho các phần khác nhau của embed')
    .addStringOption(option =>
      option.setName('section')
        .setDescription('Phần emoji muốn thay đổi')
        .setRequired(true)
        .addChoices(
          { name: 'Diemdanh - Success', value: 'diemdanh.success' },
          { name: 'Diemdanh - Reward', value: 'diemdanh.reward' },
          { name: 'Diemdanh - Nitro', value: 'diemdanh.nitro' },
          { name: 'Diemdanh - Total', value: 'diemdanh.total' },
          { name: 'Diemdanh - Cooldown', value: 'diemdanh.cooldown' },
          { name: 'Profile - Cartridge', value: 'profile.cartridge' },
          { name: 'Profile - Voice', value: 'profile.voice' },
          { name: 'Profile - Rank', value: 'profile.rank' },
          { name: 'Profile - Voice Rank', value: 'profile.voiceRank' },
          { name: 'Top - Cartridge', value: 'top.cartridge' },
          { name: 'Top - Voice', value: 'top.voice' },
          { name: 'Top - Rank', value: 'top.rank' },
          { name: 'Shop - Title', value: 'shop.title' },
          { name: 'Shop - Price', value: 'shop.price' },
          { name: 'Shop - Buy', value: 'shop.buy' }
        )
    )
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji mới')
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

    const section = interaction.options.getString('section');
    const emoji = interaction.options.getString('emoji');

    // Update the specific emoji in the config
    const [category, subcategory] = section.split('.');
    if (embedConfig.emojis[category] && embedConfig.emojis[category][subcategory]) {
      embedConfig.emojis[category][subcategory] = emoji;
      
      await interaction.reply({
        content: `✅ Đã thay đổi emoji cho ${section} thành: ${emoji}`,
        flags: 64 // Ephemeral flag
      });
    } else {
      await interaction.reply({
        content: '❌ Phần emoji không tồn tại.',
        flags: 64 // Ephemeral flag
      });
    }
  }
}; 