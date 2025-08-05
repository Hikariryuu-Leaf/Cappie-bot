const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { safeEditReply } = require('../utils/interactionHelper');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cartridge')
    .setDescription('Quản lý cartridge của người dùng')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Tăng cartridge cho người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần tăng cartridge')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Số lượng cartridge cần tăng')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Giảm cartridge của người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần giảm cartridge')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Số lượng cartridge cần giảm')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Đặt cartridge cho người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần đặt cartridge')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Số lượng cartridge cần đặt')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Kiểm tra cartridge của người dùng')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng cần kiểm tra')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      const users = loadJSON(userDataPath);
      const userId = targetUser.id;

      // Khởi tạo user nếu chưa có
      if (!users[userId]) {
        users[userId] = {
          cartridge: 0,
          voiceTime: 0,
          totalVoice: 0,
          lastClaim: 0
        };
      }

      const oldCartridge = users[userId].cartridge || 0;

      switch (subcommand) {
        case 'add':
          await this.addCartridge(interaction, users, userId, targetUser, amount, oldCartridge);
          break;
        case 'remove':
          await this.removeCartridge(interaction, users, userId, targetUser, amount, oldCartridge);
          break;
        case 'set':
          await this.setCartridge(interaction, users, userId, targetUser, amount, oldCartridge);
          break;
        case 'check':
          await this.checkCartridge(interaction, users, userId, targetUser, oldCartridge);
          break;
      }
    } catch (error) {
      console.error('Lỗi trong execute cartridge:', error);
      await safeEditReply(interaction, {
        content: '❌ Có lỗi xảy ra khi thực hiện lệnh cartridge.',
        flags: 64
      });
    }
  },

  async addCartridge(interaction, users, userId, targetUser, amount, oldCartridge) {
    const newCartridge = oldCartridge + amount;
    users[userId].cartridge = newCartridge;
    saveJSON(userDataPath, users);

    const embed = new EmbedBuilder()
      .setTitle('✅ Tăng Cartridge Thành Công')
      .setDescription(`Đã tăng **${amount} Cartridge** cho ${targetUser}`)
      .addFields(
        { name: '👤 Người Dùng', value: `${targetUser}`, inline: true },
        { name: '📊 Cartridge Cũ', value: `${oldCartridge}`, inline: true },
        { name: '📈 Cartridge Mới', value: `${newCartridge}`, inline: true },
        { name: '➕ Tăng', value: `+${amount}`, inline: true },
        { name: '👤 Thực Hiện Bởi', value: `${interaction.user}`, inline: true },
        { name: '📅 Thời Gian', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor('#00ff88')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();

    await safeEditReply(interaction, { embeds: [embed] });
  },

  async removeCartridge(interaction, users, userId, targetUser, amount, oldCartridge) {
    const newCartridge = Math.max(0, oldCartridge - amount);
    users[userId].cartridge = newCartridge;
    saveJSON(userDataPath, users);

    const embed = new EmbedBuilder()
      .setTitle('✅ Giảm Cartridge Thành Công')
      .setDescription(`Đã giảm **${amount} Cartridge** của ${targetUser}`)
      .addFields(
        { name: '👤 Người Dùng', value: `${targetUser}`, inline: true },
        { name: '📊 Cartridge Cũ', value: `${oldCartridge}`, inline: true },
        { name: '📉 Cartridge Mới', value: `${newCartridge}`, inline: true },
        { name: '➖ Giảm', value: `-${amount}`, inline: true },
        { name: '👤 Thực Hiện Bởi', value: `${interaction.user}`, inline: true },
        { name: '📅 Thời Gian', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor('#ff6666')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();

    await safeEditReply(interaction, { embeds: [embed] });
  },

  async setCartridge(interaction, users, userId, targetUser, amount, oldCartridge) {
    users[userId].cartridge = amount;
    saveJSON(userDataPath, users);

    const embed = new EmbedBuilder()
      .setTitle('✅ Đặt Cartridge Thành Công')
      .setDescription(`Đã đặt **${amount} Cartridge** cho ${targetUser}`)
      .addFields(
        { name: '👤 Người Dùng', value: `${targetUser}`, inline: true },
        { name: '📊 Cartridge Cũ', value: `${oldCartridge}`, inline: true },
        { name: '📋 Cartridge Mới', value: `${amount}`, inline: true },
        { name: '🔄 Thay Đổi', value: `${amount - oldCartridge}`, inline: true },
        { name: '👤 Thực Hiện Bởi', value: `${interaction.user}`, inline: true },
        { name: '📅 Thời Gian', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor('#0099ff')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();

    await safeEditReply(interaction, { embeds: [embed] });
  },

  async checkCartridge(interaction, users, userId, targetUser, cartridge) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Thông Tin Cartridge')
      .setDescription(`Thông tin cartridge của ${targetUser}`)
      .addFields(
        { name: '👤 Người Dùng', value: `${targetUser}`, inline: true },
        { name: '📊 Cartridge Hiện Tại', value: `${cartridge}`, inline: true },
        { name: '👤 Kiểm Tra Bởi', value: `${interaction.user}`, inline: true },
        { name: '📅 Thời Gian', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor('#0099ff')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();

    await safeEditReply(interaction, { embeds: [embed] });
  }
}; 