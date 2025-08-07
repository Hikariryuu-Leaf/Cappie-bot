const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadAllUsers, saveUser } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('persistent')
    .setDescription('Quản lý dữ liệu User (MongoDB)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('backup')
        .setDescription('Tạo bản sao lưu dữ liệu User (MongoDB)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách tất cả user trong MongoDB')
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      switch (subcommand) {
        case 'backup':
          await this.createBackup(interaction);
          break;
        case 'list':
          await this.listUsers(interaction);
          break;
      }
    } catch (error) {
      console.error('Lỗi trong execute persistent:', error);
      try {
        await safeEditReply(interaction, {
          content: `❌ Có lỗi xảy ra khi thực hiện lệnh persistent: ${error.message}`
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async createBackup(interaction) {
    try {
      const users = await loadAllUsers();
      const embed = new EmbedBuilder()
        .setTitle('✅ Đã backup dữ liệu User (MongoDB)')
        .setDescription(`Tổng số user: **${users.length}**\nDữ liệu đã được lưu trữ an toàn trên MongoDB!`)
        .setColor('#00ff88')
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('Lỗi tạo backup:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Tạo Backup')
          .setDescription(`Có lỗi xảy ra khi tạo backup:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async listUsers(interaction) {
    try {
      const users = await loadAllUsers();
      const embed = new EmbedBuilder()
        .setTitle('📋 Danh Sách User (MongoDB)')
        .setDescription(`Tổng số user: **${users.length}**`)
        .setColor('#0099ff')
        .setTimestamp();
      let count = 0;
      for (const user of users.slice(0, 20)) {
        embed.addFields({
          name: `UserID: ${user.userId}`,
          value: `Cartridge: ${user.cartridge || 0} | Voice: ${user.totalVoice || 0}`,
          inline: false
        });
        count++;
      }
      if (users.length > 20) {
        embed.addFields({
          name: '...',
          value: `Và ${users.length - 20} user khác...`,
          inline: false
        });
      }
      await safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('Lỗi liệt kê user:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Liệt Kê User')
          .setDescription(`Có lỗi xảy ra khi liệt kê user:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 