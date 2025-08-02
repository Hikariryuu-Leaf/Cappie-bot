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
    const subcommand = interaction.options.getSubcommand();
    const backupDir = './backups';
    
    // Tạo thư mục backup nếu chưa tồn tại
    try {
      await fs.mkdir(backupDir, { recursive: true });
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
  },

  async createBackup(interaction, backupDir) {
    try {
      const backupName = interaction.options.getString('name') || 
        `backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
      
      const backupPath = path.join(backupDir, backupName);
      await fs.mkdir(backupPath, { recursive: true });

      // Backup các file dữ liệu
      const filesToBackup = [
        { source: userDataPath, dest: 'users.json' },
        { source: shopDataPath, dest: 'shop.json' },
        { source: emojiPath, dest: 'emojis.json' }
      ];

      for (const file of filesToBackup) {
        try {
          const data = await fs.readFile(file.source, 'utf8');
          await fs.writeFile(path.join(backupPath, file.dest), data);
        } catch (error) {
          console.error(`Lỗi backup file ${file.source}:`, error);
        }
      }

      // Tạo file metadata
      const metadata = {
        createdAt: new Date().toISOString(),
        createdBy: interaction.user.id,
        files: filesToBackup.map(f => f.dest)
      };
      
      await fs.writeFile(
        path.join(backupPath, 'metadata.json'), 
        JSON.stringify(metadata, null, 2)
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ Backup thành công')
        .setDescription(`Backup **${backupName}** đã được tạo`)
        .addFields(
          { name: '📁 Thư mục', value: backupPath, inline: true },
          { name: '📅 Thời gian', value: new Date().toLocaleString('vi-VN'), inline: true },
          { name: '👤 Tạo bởi', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi tạo backup:', error);
      await safeEditReply(interaction, {
        content: '❌ Có lỗi xảy ra khi tạo backup. Vui lòng thử lại.'
      });
    }
  },

  async listBackups(interaction, backupDir) {
    try {
      const items = await fs.readdir(backupDir, { withFileTypes: true });
      const backups = items.filter(item => item.isDirectory());

      if (backups.length === 0) {
        return safeEditReply(interaction, {
          content: '📂 Không có backup nào được tìm thấy.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Danh sách Backup')
        .setColor('#0099ff')
        .setTimestamp();

      for (const backup of backups) {
        try {
          const metadataPath = path.join(backupDir, backup.name, 'metadata.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          
          embed.addFields({
            name: `📁 ${backup.name}`,
            value: `📅 Tạo lúc: ${new Date(metadata.createdAt).toLocaleString('vi-VN')}\n👤 Tạo bởi: <@${metadata.createdBy}>`,
            inline: false
          });
        } catch (error) {
          embed.addFields({
            name: `📁 ${backup.name}`,
            value: '❌ Không thể đọc metadata',
            inline: false
          });
        }
      }

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi liệt kê backup:', error);
      await safeEditReply(interaction, {
        content: '❌ Có lỗi xảy ra khi liệt kê backup.'
      });
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
        return safeEditReply(interaction, {
          content: `❌ Backup **${backupName}** không tồn tại.`
        });
      }

      // Xác nhận restore
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Xác nhận Restore')
        .setDescription(`Bạn có chắc chắn muốn khôi phục dữ liệu từ backup **${backupName}**?\n\n**⚠️ Cảnh báo:** Dữ liệu hiện tại sẽ bị ghi đè!`)
        .setColor('#ff9900')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [confirmEmbed] });

      // Restore các file
      const filesToRestore = [
        { source: 'users.json', dest: userDataPath },
        { source: 'shop.json', dest: shopDataPath },
        { source: 'emojis.json', dest: emojiPath }
      ];

      for (const file of filesToRestore) {
        try {
          const data = await fs.readFile(path.join(backupPath, file.source), 'utf8');
          await fs.writeFile(file.dest, data);
        } catch (error) {
          console.error(`Lỗi restore file ${file.source}:`, error);
        }
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Restore thành công')
        .setDescription(`Dữ liệu đã được khôi phục từ backup **${backupName}**`)
        .addFields(
          { name: '📁 Backup', value: backupName, inline: true },
          { name: '📅 Thời gian', value: new Date().toLocaleString('vi-VN'), inline: true },
          { name: '👤 Thực hiện bởi', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });

    } catch (error) {
      console.error('Lỗi restore backup:', error);
      await safeEditReply(interaction, {
        content: '❌ Có lỗi xảy ra khi restore backup.'
      });
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
        return safeEditReply(interaction, {
          content: `❌ Backup **${backupName}** không tồn tại.`
        });
      }

      // Xóa thư mục backup
      await fs.rm(backupPath, { recursive: true, force: true });

      const embed = new EmbedBuilder()
        .setTitle('✅ Xóa backup thành công')
        .setDescription(`Backup **${backupName}** đã được xóa`)
        .addFields(
          { name: '📁 Backup', value: backupName, inline: true },
          { name: '📅 Thời gian', value: new Date().toLocaleString('vi-VN'), inline: true },
          { name: '👤 Xóa bởi', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [embed] });

    } catch (error) {
      console.error('Lỗi xóa backup:', error);
      await safeEditReply(interaction, {
        content: '❌ Có lỗi xảy ra khi xóa backup.'
      });
    }
  }
}; 