const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { safeEditReply } = require('../utils/interactionHelper');
const { userDataPath, shopDataPath, emojiPath } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Backup hoặc restore dữ liệu bot')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Tạo backup dữ liệu')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Tên backup (không bắt buộc)')
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
        .setName('restore')
        .setDescription('Khôi phục dữ liệu từ backup')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Tên backup để khôi phục')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Xóa backup')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Tên backup để xóa')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const backupDir = './manual_backups';
      
      // Tạo thư mục backup nếu chưa tồn tại
      try {
        const mkdirPromise = fs.mkdir(backupDir, { recursive: true });
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Mkdir operation timed out')), 5000);
        });
        
        await Promise.race([mkdirPromise, timeoutPromise]);
      } catch (error) {
        console.error('Lỗi tạo thư mục backup:', error);
      }

      switch (subcommand) {
        case 'create':
          await this.createBackup(interaction, backupDir);
          break;
        case 'list':
          await this.listBackups(interaction, backupDir);
          break;
        case 'restore':
          await this.restoreBackup(interaction, backupDir);
          break;
        case 'delete':
          await this.deleteBackup(interaction, backupDir);
          break;
      }
    } catch (error) {
      console.error('Lỗi trong execute backup:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi thực hiện lệnh backup.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  },

  async createBackup(interaction, backupDir) {
    try {
      const backupName = interaction.options.getString('name') || 
        `manual_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
      
      const backupPath = path.join(backupDir, backupName);
      await fs.mkdir(backupPath, { recursive: true });

      // Backup các file dữ liệu chính
      const filesToBackup = [
        { source: userDataPath, dest: 'users.json' },
        { source: shopDataPath, dest: 'shop.json' },
        { source: emojiPath, dest: 'emojis.json' }
      ];

      let successCount = 0;
      const backupResults = [];

      for (const file of filesToBackup) {
        try {
          // Kiểm tra file có tồn tại không
          await fs.access(file.source);
          const data = await fs.readFile(file.source, 'utf8');
          await fs.writeFile(path.join(backupPath, file.dest), data);
          successCount++;
          backupResults.push(`✅ ${file.dest}`);
        } catch (error) {
          console.error(`Lỗi backup file ${file.source}:`, error);
          backupResults.push(`❌ ${file.dest} (${error.message})`);
        }
      }

      // Tạo file metadata
      const metadata = {
        createdAt: new Date().toISOString(),
        createdBy: interaction.user.id,
        files: filesToBackup.map(f => f.dest),
        fileCount: successCount,
        totalFiles: filesToBackup.length,
        backupType: 'manual'
      };
      
      await fs.writeFile(
        path.join(backupPath, 'metadata.json'), 
        JSON.stringify(metadata, null, 2)
      );

      const embed = new EmbedBuilder()
        .setTitle('💾 Backup Thành Công')
        .setDescription(`✅ Đã tạo backup **\`${backupName}\`** thành công!`)
        .addFields(
          { 
            name: '📁 Thông Tin Backup', 
            value: `**Tên:** \`${backupName}\`\n**Đường dẫn:** \`${backupPath}\`\n**Số file:** \`${successCount}/${filesToBackup.length}\``, 
            inline: false 
          },
          { 
            name: '📄 Chi Tiết File', 
            value: backupResults.join('\n'), 
            inline: false 
          },
          { 
            name: '📅 Thời Gian', 
            value: `\`${new Date().toLocaleString('vi-VN')}\``, 
            inline: true 
          },
          { 
            name: '👤 Người Tạo', 
            value: `<@${interaction.user.id}>`, 
            inline: true 
          }
        )
        .setColor('#00ff88')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: '🛡️ Dữ liệu đã được bảo vệ an toàn', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi tạo backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Tạo Backup')
        .setDescription(`Có lỗi xảy ra khi tạo backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  async listBackups(interaction, backupDir) {
    try {
      const items = await fs.readdir(backupDir, { withFileTypes: true });
      const backups = items.filter(item => item.isDirectory());

      if (backups.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle('📂 Không Có Backup')
          .setDescription('Chưa có backup thủ công nào được tạo.\nSử dụng `/backup create` để tạo backup đầu tiên.')
          .setColor('#ffaa00')
          .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
          .setTimestamp();
        
        return safeEditReply(interaction, { embeds: [emptyEmbed] });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Danh Sách Backup Thủ Công')
        .setDescription(`Tìm thấy **${backups.length}** backup thủ công`)
        .setColor('#0099ff')
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: `Tổng cộng: ${backups.length} backup thủ công`, 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      for (const backup of backups) {
        try {
          const metadataPath = path.join(backupDir, backup.name, 'metadata.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          const createdDate = new Date(metadata.createdAt);
          const timeAgo = this.getTimeAgo(createdDate);
          
          embed.addFields({
            name: `📁 ${backup.name}`,
            value: `⏰ **Tạo lúc:** ${createdDate.toLocaleString('vi-VN')}\n👤 **Tạo bởi:** <@${metadata.createdBy}>\n📊 **File:** ${metadata.fileCount}/${metadata.totalFiles}\n⏱️ **${timeAgo}**`,
            inline: false
          });
        } catch (error) {
          embed.addFields({
            name: `📁 ${backup.name}`,
            value: '❌ Không thể đọc thông tin backup',
            inline: false
          });
        }
      }

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi liệt kê backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Liệt Kê Backup')
        .setDescription(`Có lỗi xảy ra khi liệt kê backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  async restoreBackup(interaction, backupDir) {
    try {
      const backupName = interaction.options.getString('name');
      const backupPath = path.join(backupDir, backupName);

      // Kiểm tra backup có tồn tại không
      try {
        await fs.access(backupPath);
      } catch (error) {
        const notFoundEmbed = new EmbedBuilder()
          .setTitle('❌ Backup Không Tồn Tại')
          .setDescription(`Backup **\`${backupName}\`** không được tìm thấy.\nSử dụng \`/backup list\` để xem danh sách backup có sẵn.`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return safeEditReply(interaction, { embeds: [notFoundEmbed] });
      }

      // Xác nhận restore
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Xác Nhận Restore')
        .setDescription(`Bạn có chắc chắn muốn khôi phục dữ liệu từ backup **\`${backupName}\`**?\n\n**🚨 Cảnh báo quan trọng:**\n• Dữ liệu hiện tại sẽ bị ghi đè hoàn toàn\n• Hành động này không thể hoàn tác\n• Bot sẽ restart sau khi restore`)
        .addFields(
          { name: '📁 Backup', value: `\`${backupName}\``, inline: true },
          { name: '👤 Thực hiện bởi', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#ff9900')
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setFooter({ 
          text: '⚠️ Hành động này sẽ ghi đè dữ liệu hiện tại', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [confirmEmbed] });

      // Restore các file
      const filesToRestore = [
        { source: 'users.json', dest: userDataPath },
        { source: 'shop.json', dest: shopDataPath },
        { source: 'emojis.json', dest: emojiPath }
      ];

      let successCount = 0;
      const restoreResults = [];

      for (const file of filesToRestore) {
        try {
          const sourcePath = path.join(backupPath, file.source);
          await fs.access(sourcePath);
          const data = await fs.readFile(sourcePath, 'utf8');
          await fs.writeFile(file.dest, data);
          successCount++;
          restoreResults.push(`✅ ${file.source}`);
        } catch (error) {
          console.error(`Lỗi restore file ${file.source}:`, error);
          restoreResults.push(`❌ ${file.source} (${error.message})`);
        }
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Restore Thành Công')
        .setDescription(`🎉 Dữ liệu đã được khôi phục thành công từ backup **\`${backupName}\`**!`)
        .addFields(
          { 
            name: '📊 Thông Tin Restore', 
            value: `**Backup:** \`${backupName}\`\n**Số file:** \`${successCount}/${filesToRestore.length}\`\n**Trạng thái:** ✅ Hoàn thành`, 
            inline: false 
          },
          { 
            name: '📄 Chi Tiết File', 
            value: restoreResults.join('\n'), 
            inline: false 
          },
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
        .setColor('#00ff88')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: '🔄 Bot sẽ restart để áp dụng thay đổi', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi restore backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Restore')
        .setDescription(`Có lỗi xảy ra khi restore backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  async deleteBackup(interaction, backupDir) {
    try {
      const backupName = interaction.options.getString('name');
      const backupPath = path.join(backupDir, backupName);

      // Kiểm tra backup có tồn tại không
      try {
        await fs.access(backupPath);
      } catch (error) {
        const notFoundEmbed = new EmbedBuilder()
          .setTitle('❌ Backup Không Tồn Tại')
          .setDescription(`Backup **\`${backupName}\`** không được tìm thấy.\nSử dụng \`/backup list\` để xem danh sách backup có sẵn.`)
          .setColor('#ff4444')
          .setTimestamp();
        
        return safeEditReply(interaction, { embeds: [notFoundEmbed] });
      }

      // Xóa thư mục backup
      await fs.rm(backupPath, { recursive: true, force: true });

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Xóa Backup Thành Công')
        .setDescription(`✅ Backup **\`${backupName}\`** đã được xóa vĩnh viễn!`)
        .addFields(
          { 
            name: '📁 Backup Đã Xóa', 
            value: `\`${backupName}\``, 
            inline: true 
          },
          { 
            name: '📅 Thời Gian', 
            value: `\`${new Date().toLocaleString('vi-VN')}\``, 
            inline: true 
          },
          { 
            name: '👤 Xóa Bởi', 
            value: `<@${interaction.user.id}>`, 
            inline: true 
          }
        )
        .setColor('#ff6666')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setFooter({ 
          text: '🗑️ Backup đã được xóa vĩnh viễn', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi xóa backup:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi Xóa Backup')
        .setDescription(`Có lỗi xảy ra khi xóa backup:\n\`${error.message}\``)
        .setColor('#ff4444')
        .setTimestamp();
      
      await safeEditReply(interaction, { embeds: [errorEmbed] });
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