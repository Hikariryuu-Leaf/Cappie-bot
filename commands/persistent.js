const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('persistent')
    .setDescription('Quản lý persistent storage và backup system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('backup')
        .setDescription('Tạo backup toàn diện và sync lên external storage')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restore')
        .setDescription('Khôi phục dữ liệu từ backup')
        .addStringOption(option =>
          option
            .setName('backup_id')
            .setDescription('ID của backup muốn khôi phục')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Xem danh sách các backup có sẵn')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sync')
        .setDescription('Sync dữ liệu ngay lập tức lên external storage')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Kiểm tra trạng thái persistent storage system')
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
          case 'sync':
            await this.syncNow(interaction, persistentStorage);
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
        .setTitle('🔄 Đang tạo backup toàn diện...')
        .setDescription('Vui lòng đợi trong khi hệ thống tạo backup và sync lên external storage.')
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Create comprehensive backup with timeout
      const backupPromise = persistentStorage.createComprehensiveBackup();
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

      // Sync to external storage with timeout
      const syncPromise = persistentStorage.syncToExternalStorage();
      const syncTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync operation timed out after 10 seconds')), 10000);
      });
      
      const syncResult = await Promise.race([syncPromise, syncTimeoutPromise]);
      
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Backup Thành Công')
        .setDescription(`Backup toàn diện đã được tạo và sync lên external storage!`)
        .addFields(
          { 
            name: '📁 Backup ID', 
            value: `\`${backupResult.backupId}\``, 
            inline: true 
          },
          { 
            name: '📊 Files', 
            value: `${backupResult.successCount}/3 files`, 
            inline: true 
          },
          { 
            name: '🔄 Sync Status', 
            value: syncResult.success ? '✅ Thành công' : '⚠️ Thất bại', 
            inline: true 
          },
          { 
            name: '🌐 Sync Method', 
            value: syncResult.method || 'Local only', 
            inline: true 
          },
          { 
            name: '📅 Thời Gian', 
            value: `\`${new Date().toLocaleString('vi-VN')}\``, 
            inline: false 
          }
        )
        .setColor('#00ff88')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: syncResult.success ? '🛡️ Dữ liệu đã được bảo vệ an toàn' : '⚠️ Chỉ backup local thành công', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Add warning if sync failed
      if (!syncResult.success) {
        successEmbed.addFields({
          name: '⚠️ Lưu ý',
          value: `Sync thất bại: ${syncResult.error}\nDữ liệu chỉ được lưu local. Kiểm tra cấu hình GitHub.`,
          inline: false
        });
      }

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
      const backupId = interaction.options.getString('backup_id');
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 Đang khôi phục dữ liệu...')
        .setDescription(`Đang khôi phục từ backup${backupId ? ` \`${backupId}\`` : ' mới nhất'}...`)
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Add timeout for restore operation
      const restorePromise = persistentStorage.restoreFromExternalStorage(backupId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Restore operation timed out after 20 seconds')), 20000);
      });

      // Restore from external storage with timeout
      console.log(`[PERSISTENT COMMAND] Starting restore with backup ID: ${backupId || 'latest'}`);
      const restoreResult = await Promise.race([restorePromise, timeoutPromise]);
      console.log(`[PERSISTENT COMMAND] Restore result:`, restoreResult);
      
      if (!restoreResult || !restoreResult.success) {
        const errorMessage = restoreResult?.error || 'Unknown error occurred';
        console.error(`[PERSISTENT COMMAND] Restore failed: ${errorMessage}`);
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục')
          .setDescription(`Không thể khôi phục dữ liệu: ${errorMessage}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return await safeEditReply(interaction, { embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Khôi Phục Thành Công')
        .setDescription(`Dữ liệu đã được khôi phục thành công!`)
        .addFields(
          { 
            name: '📁 Backup ID', 
            value: backupId || 'Mới nhất', 
            inline: true 
          },
          { 
            name: '📊 Files Restored', 
            value: `${restoreResult.successCount || 0}/3 files`, 
            inline: true 
          },
          { 
            name: '🌐 Restore Method', 
            value: restoreResult.method || 'Local', 
            inline: true 
          },
          { 
            name: '📅 Thời Gian', 
            value: `\`${new Date().toLocaleString('vi-VN')}\``, 
            inline: true 
          }
        )
        .setColor('#00ff88')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: restoreResult.method === 'github' ? '🔄 Khôi phục từ GitHub thành công' : '🔄 Khôi phục từ local backup', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi khôi phục backup:', error);
      
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục')
          .setDescription(`Có lỗi xảy ra khi khôi phục backup:\n\`${error.message}\``)
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
      // Get available backups with timeout
      const backupsPromise = Promise.resolve(persistentStorage.getAvailableBackups());
      const backupsTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Backup list timed out after 5 seconds')), 5000);
      });
      
      const backups = await Promise.race([backupsPromise, backupsTimeoutPromise]);

      if (backups.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle('📂 Không Có Backup')
          .setDescription('Chưa có backup nào được tạo.\nSử dụng `/persistent backup` để tạo backup đầu tiên.')
          .setColor('#ffaa00')
          .setTimestamp();
        
        return await safeEditReply(interaction, { embeds: [emptyEmbed] });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Danh Sách Backup')
        .setDescription(`Tìm thấy **${backups.length}** backup`)
        .setColor('#0099ff')
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: `Tổng cộng: ${backups.length} backup`, 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Show latest 5 backups
      const recentBackups = backups.slice(0, 5);
      
      for (const backup of recentBackups) {
        const createdDate = new Date(backup.metadata.createdAt);
        const timeAgo = this.getTimeAgo(createdDate);
        
        embed.addFields({
          name: `📁 ${backup.id}`,
          value: `⏰ **Tạo lúc:** ${createdDate.toLocaleString('vi-VN')}\n📊 **Files:** ${backup.metadata.successCount}/${backup.metadata.totalFiles}\n⏱️ **${timeAgo}**`,
          inline: false
        });
      }

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

  async syncNow(interaction, persistentStorage) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🔄 Đang đồng bộ dữ liệu...')
        .setDescription('Đang sync dữ liệu lên external storage...')
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Sync to external storage with timeout
      const syncPromise = persistentStorage.syncToExternalStorage();
      const syncTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync operation timed out after 10 seconds')), 10000);
      });
      
      const syncResult = await Promise.race([syncPromise, syncTimeoutPromise]);
      
      const resultEmbed = new EmbedBuilder()
        .setTitle(syncResult ? '✅ Sync Thành Công' : '❌ Sync Thất Bại')
        .setDescription(syncResult 
          ? 'Dữ liệu đã được sync lên external storage thành công!'
          : 'Không thể sync dữ liệu lên external storage.'
        )
        .addFields(
          { 
            name: '📅 Thời Gian', 
            value: `\`${new Date().toLocaleString('vi-VN')}\``, 
            inline: true 
          },
          { 
            name: '👤 Thực Hiện Bởi', 
            value: `<@${interaction.user.id}>`, 
            inline: true 
          }
        )
        .setColor(syncResult ? '#00ff88' : '#ff4444')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [resultEmbed] });

    } catch (error) {
      console.error('Lỗi sync:', error);
      
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Sync')
          .setDescription(`Có lỗi xảy ra khi sync dữ liệu:\n\`${error.message}\``)
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
        .setTitle('🔄 Đang kiểm tra trạng thái...')
        .setDescription('Đang kiểm tra cấu hình và kết nối external storage.')
        .setColor('#ffaa00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

      // Get storage status with timeout
      const statusPromise = persistentStorage.getStorageStatus();
      const statusTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Status check timed out after 8 seconds')), 8000);
      });
      
      const status = await Promise.race([statusPromise, statusTimeoutPromise]);

      const statusEmbed = new EmbedBuilder()
        .setTitle('📊 Trạng Thái External Storage')
        .setDescription(`Kết nối với external storage: ${status.connected ? '✅ Thành công' : '❌ Thất bại'}`)
        .addFields(
          { name: '🌐 Kết nối', value: status.connected ? '✅ Thành công' : '❌ Thất bại', inline: true },
          { name: '💾 Phương thức', value: status.method || 'Không xác định', inline: true },
          { name: '🔗 Repository', value: status.url || 'Không có', inline: true },
          { name: '👤 Thực Hiện Bởi', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📅 Thời Gian', value: `\`${new Date().toLocaleString('vi-VN')}\``, inline: true }
        )
        .setColor(status.connected ? '#00ff88' : '#ff4444')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setTimestamp();

      // Add error details if connection failed
      if (!status.connected && status.error) {
        statusEmbed.addFields({
          name: '❌ Lỗi',
          value: `\`${status.error}\``,
          inline: false
        });
      }

      await safeEditReply(interaction, { embeds: [statusEmbed] });

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
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  }
}; 