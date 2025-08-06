const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { safeReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('persistent')
    .setDescription('Quản lý persistent storage để bảo vệ dữ liệu')
    .addSubcommand(subcommand =>
      subcommand
        .setName('backup')
        .setDescription('Tạo backup toàn diện và sync lên external storage')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restore')
        .setDescription('Khôi phục dữ liệu từ external storage')
        .addStringOption(option =>
          option
            .setName('backup_id')
            .setDescription('ID của backup để khôi phục (để trống để dùng backup mới nhất)')
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
        .setName('sync')
        .setDescription('Đồng bộ dữ liệu lên external storage ngay lập tức')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Kiểm tra trạng thái cấu hình và kết nối external storage')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Defer the interaction immediately to prevent timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }
      
      const subcommand = interaction.options.getSubcommand();
      const persistentStorage = interaction.client.persistentStorage;
      
      if (!persistentStorage) {
        return interaction.editReply({
          content: '❌ Persistent storage system chưa được khởi tạo.'
        });
      }

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
    } catch (error) {
      console.error('Lỗi trong execute persistent:', error);
      try {
        await interaction.editReply({
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh persistent.'
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

      await interaction.editReply({ embeds: [embed] });

      // Create comprehensive backup
      const backupResult = await persistentStorage.createComprehensiveBackup();
      
      if (!backupResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Tạo Backup')
          .setDescription(`Không thể tạo backup: ${backupResult.error}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Sync to external storage
      const syncResult = await persistentStorage.syncToExternalStorage();
      
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

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi tạo backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Tạo Backup')
        .setDescription(`Có lỗi xảy ra khi tạo backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      try {
        await interaction.editReply({ embeds: [errorEmbed] });
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

      await interaction.editReply({ embeds: [embed] });

      // Restore from external storage
      console.log(`[PERSISTENT COMMAND] Starting restore with backup ID: ${backupId || 'latest'}`);
      const restoreResult = await persistentStorage.restoreFromExternalStorage(backupId);
      console.log(`[PERSISTENT COMMAND] Restore result:`, restoreResult);
      
      if (!restoreResult || !restoreResult.success) {
        const errorMessage = restoreResult?.error || 'Unknown error occurred';
        console.error(`[PERSISTENT COMMAND] Restore failed: ${errorMessage}`);
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi Khôi Phục')
          .setDescription(`Không thể khôi phục dữ liệu: ${errorMessage}`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
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

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi khôi phục backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Khôi Phục')
        .setDescription(`Có lỗi xảy ra khi khôi phục backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      try {
        await interaction.editReply({ embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async listBackups(interaction, persistentStorage) {
    try {
      const backups = persistentStorage.getAvailableBackups();

      if (backups.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle('📂 Không Có Backup')
          .setDescription('Chưa có backup nào được tạo.\nSử dụng `/persistent backup` để tạo backup đầu tiên.')
          .setColor('#ffaa00')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [emptyEmbed] });
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

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Lỗi liệt kê backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Liệt Kê Backup')
        .setDescription(`Có lỗi xảy ra khi liệt kê backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      try {
        await interaction.editReply({ embeds: [errorEmbed] });
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

      await interaction.editReply({ embeds: [embed] });

      // Sync to external storage
      const syncResult = await persistentStorage.syncToExternalStorage();
      
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

      await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
      console.error('Lỗi sync:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Sync')
        .setDescription(`Có lỗi xảy ra khi sync dữ liệu:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      try {
        await interaction.editReply({ embeds: [errorEmbed] });
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

      await interaction.editReply({ embeds: [embed] });

      const status = await persistentStorage.getStorageStatus();

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

      await interaction.editReply({ embeds: [statusEmbed] });

    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Trạng Thái')
        .setDescription(`Có lỗi xảy ra khi kiểm tra trạng thái:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      try {
        await interaction.editReply({ embeds: [errorEmbed] });
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