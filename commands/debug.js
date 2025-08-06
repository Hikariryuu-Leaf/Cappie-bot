const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Debug cấu hình bot và environment variables')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Defer the interaction immediately to prevent timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 Debug Bot Configuration')
        .setColor('#ffaa00')
        .setTimestamp();

      // Kiểm tra environment variables
      const envVars = {
        'Discord Bot Token': process.env.TOKEN ? '✅ SET' : '❌ NOT SET',
        'Owner ID': process.env.OWNER_ID ? '✅ SET' : '❌ NOT SET',
        'Log Channel ID': process.env.LOG_CHANNEL_ID ? '✅ SET' : '❌ NOT SET',
        'Exclusive Role ID': process.env.EXCLUSIVE_ROLE_ID ? '✅ SET' : '❌ NOT SET',
        'GitHub Repository': process.env.GITHUB_REPO ? '✅ SET' : '❌ NOT SET',
        'GitHub Token': process.env.GITHUB_TOKEN ? '✅ SET' : '❌ NOT SET'
      };

      embed.addFields(
        { name: '📋 Environment Variables', value: 'Kiểm tra cấu hình:', inline: false },
        ...Object.entries(envVars).map(([key, value]) => ({
          name: key,
          value: value,
          inline: true
        }))
      );

      // Kiểm tra cấu hình GitHub
      if (process.env.GITHUB_REPO && process.env.GITHUB_TOKEN) {
        const repoInfo = process.env.GITHUB_REPO;
        const tokenPreview = process.env.GITHUB_TOKEN.substring(0, 10) + '...';
        
        embed.addFields(
          { name: '🌐 GitHub Configuration', value: 'Chi tiết cấu hình:', inline: false },
          { name: 'Repository', value: `\`${repoInfo}\``, inline: true },
          { name: 'Token Preview', value: `\`${tokenPreview}\``, inline: true }
        );

        // Kiểm tra format
        const formatChecks = {
          'Repo Format': repoInfo.includes('/') ? '✅ Correct' : '❌ Wrong format',
          'Token Format': process.env.GITHUB_TOKEN.startsWith('ghp_') ? '✅ Correct' : '❌ Wrong format'
        };

        embed.addFields(
          { name: '🔧 Format Validation', value: 'Kiểm tra format:', inline: false },
          ...Object.entries(formatChecks).map(([key, value]) => ({
            name: key,
            value: value,
            inline: true
          }))
        );
      }

      // Kiểm tra bot status
      const botStatus = {
        'Bot Online': interaction.client.user ? '✅ Online' : '❌ Offline',
        'Guilds Count': interaction.client.guilds.cache.size,
        'Commands Loaded': interaction.client.commands.size,
        'Events Loaded': interaction.client.events.size
      };

      embed.addFields(
        { name: '🤖 Bot Status', value: 'Trạng thái bot:', inline: false },
        ...Object.entries(botStatus).map(([key, value]) => ({
          name: key,
          value: value.toString(),
          inline: true
        }))
      );

      // Thêm hướng dẫn
      embed.addFields({
        name: '💡 Hướng Dẫn',
        value: 'Nếu có lỗi:\n1. Kiểm tra environment variables trên Render\n2. Chạy `node debug-github-connection.js`\n3. Restart bot sau khi sửa',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('[ERROR] Debug command error:', error);
      try {
        await interaction.editReply({
          content: '❌ Có lỗi xảy ra khi debug. Vui lòng thử lại.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 