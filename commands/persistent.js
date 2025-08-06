const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('persistent')
    .setDescription('Quản lý backup và restore User Data')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('backup')
        .setDescription('Tạo backup User Data ngay lập tức')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restore')
        .setDescription('Khôi phục User Data từ backup')
        .addStringOption(option =>
          option
            .setName('backup_name')
            .setDescription('Tên backup để khôi phục (để trống để dùng backup mới nhất)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách các backup có sẵn')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('manual-restore')
        .setDescription('Khôi phục từ manual backup')
        .addStringOption(option =>
          option
            .setName('backup_name')
            .setDescription('Tên manual backup để khôi phục')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Kiểm tra trạng thái hệ thống backup')
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const persistentStorage = interaction.client.persistentStorage;
      
      if (!persistentStorage) {
        return await safeEditReply(interaction, {
          content: '❌ Persistent storage system chưa được khởi tạo.'
        });
      }

      // Add timeout handling for the entire command
      const commandPromise = (async () => {
        switch (subcommand) {
          case 'backup':
            await this.createBackup(interaction, persistentStorage);
            break;
          case 'restore':
            await this.restoreBackup(interaction, persistentStorage);
            break;
          case 'list':
            await this.listBackups(interaction, persistentStorage);
            break;
          case 'manual-restore':
            await this.manualRestore(interaction, persistentStorage);
            break;
          case 'status':
            await this.checkStatus(interaction, persistentStorage);
            break;
        }
      })();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Persistent command timed out after 20 seconds')), 20000);
      });

      await Promise.race([commandPromise, timeoutPromise]);
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

  async createBackup(interaction, persistentStorage) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🔄 Đang tạo backup User Data...')
        .setDescription('Vui lòng đợi trong khi hệ thống tạo backup.')
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Create backup with timeout
      const backupPromise = persistentStorage.createUserDataBackup();
      const backupTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Backup creation timed out after 15 seconds')), 15000);
      });
      
      const backupResult = await Promise.race([backupPromise, backupTimeoutPromise]);
      
      if (!backupResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Tạo Backup')
          .setDescription(`Không thể tạo backup: ${backupResult.error}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return await safeEditReply(interaction, { embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Backup Thành Công')
        .setDescription(`Đã tạo backup **\`${backupResult.backupId}\`** thành công!`)
        .addFields(
          { name: '📊 Số lượng User', value: `${backupResult.userCount} users`, inline: true },
          { name: '📁 Files', value: `${backupResult.successCount}/${backupResult.totalFiles}`, inline: true },
          { name: '🆔 Backup ID', value: `\`${backupResult.backupId}\``, inline: false }
        )
        .setColor('#00ff88')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

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

  async restoreBackup(interaction, persistentStorage) {
    try {
      const backupId = interaction.options.getString('backup_name');
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 Đang khôi phục User Data...')
        .setDescription(backupId ? `Đang khôi phục từ backup: \`${backupId}\`` : 'Đang khôi phục từ backup mới nhất')
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Restore with timeout
      const restorePromise = persistentStorage.restoreFromLocalBackup(backupId);
      const restoreTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Restore operation timed out after 15 seconds')), 15000);
      });
      
      const restoreResult = await Promise.race([restorePromise, restoreTimeoutPromise]);
      
      if (!restoreResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục')
          .setDescription(`Không thể khôi phục: ${restoreResult.error}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return await safeEditReply(interaction, { embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Khôi Phục Thành Công')
        .setDescription('Đã khôi phục User Data thành công!')
        .addFields(
          { name: '📊 Số lượng User', value: `${restoreResult.userCount} users`, inline: true },
          { name: '🆔 Backup ID', value: `\`${restoreResult.backupId}\``, inline: true },
          { name: '📝 Lưu ý', value: 'Dữ liệu hiện tại đã được backup trước khi khôi phục', inline: false }
        )
        .setColor('#00ff88')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi khôi phục backup:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục')
          .setDescription(`Có lỗi xảy ra khi khôi phục:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async manualRestore(interaction, persistentStorage) {
    try {
      const backupName = interaction.options.getString('backup_name');
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 Đang khôi phục từ Manual Backup...')
        .setDescription(`Đang khôi phục từ manual backup: \`${backupName}\``)
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Restore from manual backup with timeout
      const restorePromise = persistentStorage.restoreFromManualBackup(backupName);
      const restoreTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Manual restore operation timed out after 15 seconds')), 15000);
      });
      
      const restoreResult = await Promise.race([restorePromise, restoreTimeoutPromise]);
      
      if (!restoreResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục Manual Backup')
          .setDescription(`Không thể khôi phục: ${restoreResult.error}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return await safeEditReply(interaction, { embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Khôi Phục Manual Backup Thành Công')
        .setDescription('Đã khôi phục User Data từ manual backup thành công!')
        .addFields(
          { name: '📊 Số lượng User', value: `${restoreResult.userCount} users`, inline: true },
          { name: '📁 Backup Name', value: `\`${restoreResult.backupName}\``, inline: true },
          { name: '📝 Lưu ý', value: 'Dữ liệu hiện tại đã được backup trước khi khôi phục', inline: false }
        )
        .setColor('#00ff88')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi khôi phục manual backup:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục Manual Backup')
          .setDescription(`Có lỗi xảy ra khi khôi phục:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async listBackups(interaction, persistentStorage) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('📋 Danh Sách Backup')
        .setColor('#0099ff')
        .setTimestamp();

      // Lấy danh sách local backups
      const localBackups = persistentStorage.getAvailableBackups();
      const manualBackups = persistentStorage.getManualBackups();
      
      if (localBackups.length === 0 && manualBackups.length === 0) {
        embed.setDescription('❌ Không có backup nào được tìm thấy.');
        return await safeEditReply(interaction, { embeds: [embed] });
      }

      // Hiển thị local backups
      if (localBackups.length > 0) {
        embed.addFields({
          name: '🔄 Local Backups',
          value: localBackups.slice(0, 5).map((backup, index) => 
            `${index + 1}. **${backup.id}**\n   📊 ${backup.metadata.userCount} users | 📅 ${this.getTimeAgo(backup.metadata.createdAt)}`
          ).join('\n\n'),
          inline: false
        });
      }

      // Hiển thị manual backups
      if (manualBackups.length > 0) {
        embed.addFields({
          name: '📁 Manual Backups',
          value: manualBackups.slice(0, 5).map((backup, index) => 
            `${index + 1}. **${backup.name}**\n   📊 ${backup.userCount} users | 📅 ${this.getTimeAgo(backup.createdAt)}`
          ).join('\n\n'),
          inline: false
        });
      }

      embed.addFields({
        name: '📊 Tổng Quan',
        value: `🔄 Local: ${localBackups.length} backups\n📁 Manual: ${manualBackups.length} backups`,
        inline: false
      });

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi liệt kê backup:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Liệt Kê Backup')
          .setDescription(`Có lỗi xảy ra khi liệt kê backup:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async checkStatus(interaction, persistentStorage) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('📊 Trạng Thái Hệ Thống Backup')
        .setColor('#0099ff')
        .setTimestamp();

      // Lấy trạng thái hệ thống
      const status = persistentStorage.getSystemStatus();
      const localBackups = persistentStorage.getAvailableBackups();
      const manualBackups = persistentStorage.getManualBackups();

      embed.addFields(
        { name: '🔄 Auto Backup', value: status.autoBackupEnabled ? '✅ Đang chạy' : '❌ Đã dừng', inline: true },
        { name: '⏱️ Interval', value: `${Math.floor(status.autoBackupInterval / 60000)} phút`, inline: true },
        { name: '📊 Max Backups', value: `${status.maxLocalBackups}`, inline: true },
        { name: '🔄 Local Backups', value: `${status.localBackupCount}`, inline: true },
        { name: '📁 Manual Backups', value: `${status.manualBackupCount}`, inline: true },
        { name: '🕐 Last Backup', value: status.lastBackupTime ? this.getTimeAgo(new Date(status.lastBackupTime)) : 'Chưa có', inline: true }
      );

      if (localBackups.length > 0) {
        embed.addFields({
          name: '🆕 Backup Mới Nhất',
          value: `**${localBackups[0].id}**\n📊 ${localBackups[0].metadata.userCount} users | 📅 ${this.getTimeAgo(localBackups[0].metadata.createdAt)}`,
          inline: false
        });
      }

      if (manualBackups.length > 0) {
        embed.addFields({
          name: '📁 Manual Backup Mới Nhất',
          value: `**${manualBackups[0].name}**\n📊 ${manualBackups[0].userCount} users | 📅 ${this.getTimeAgo(manualBackups[0].createdAt)}`,
          inline: false
        });
      }

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái:', error);
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Trạng Thái')
          .setDescription(`Có lỗi xảy ra khi kiểm tra trạng thái:\n\`${error.message}\``)
          .setColor('#ff4444')
          .setTimestamp();
        
        await safeEditReply(interaction, { embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  }
}; 