const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath } = require('../config');
const { formatTime } = require('../utils/formatTime');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicecheck')
    .setDescription('Kiểm tra trạng thái voice tracking và cartridge của người dùng')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Người dùng cần kiểm tra (để trống để kiểm tra chính mình)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const userId = targetUser.id;
      
      // Load user data with timeout
      const loadPromise = loadJSON(userDataPath);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load operation timed out')), 5000);
      });
      
      const users = await Promise.race([loadPromise, timeoutPromise]);
      
      // Tạo user nếu chưa có
      if (!users[userId]) {
        users[userId] = {
          cartridge: 0,
          voiceTime: 0,
          totalVoice: 0,
          lastClaim: 0
        };
      }

      const userData = users[userId];
      const totalVoice = userData.totalVoice || 0;
      const voiceTimeFormatted = formatTime(totalVoice);
      
      // Tính toán cartridge từ voice time
      const cartridgeFromVoice = Math.floor(totalVoice / 600); // 600 giây = 10 phút
      const actualCartridge = userData.cartridge || 0;
      const difference = actualCartridge - cartridgeFromVoice;

      const embed = new EmbedBuilder()
        .setColor(embedConfig.colors.profile)
        .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
        .setTitle('🎙️ Voice Tracking Status')
        .setThumbnail(targetUser.displayAvatarURL({ size: 256, format: 'png' }))
        .addFields(
          { 
            name: '📊 Tổng Thời Gian Voice', 
            value: `\`${voiceTimeFormatted}\``, 
            inline: true 
          },
          { 
            name: '🎁 Cartridge Hiện Tại', 
            value: `\`${actualCartridge}\``, 
            inline: true 
          },
          { 
            name: '🧮 Cartridge Từ Voice', 
            value: `\`${cartridgeFromVoice}\` (${totalVoice}s ÷ 600s)`, 
            inline: true 
          },
          { 
            name: '⚖️ Chênh Lệch', 
            value: difference === 0 ? '✅ Chính xác' : `⚠️ \`${difference}\` (từ điểm danh/shop)`, 
            inline: true 
          },
          { 
            name: '⏱️ Thời Gian Cần Để 1 Cartridge', 
            value: '`10 phút (600 giây)`', 
            inline: true 
          },
          { 
            name: '🔄 Hệ Thống Voice Tracking', 
            value: '✅ Hoạt động bình thường', 
            inline: true 
          }
        )
        .setFooter({ 
          text: 'Cartridge được cộng dựa trên thời gian voice thực tế', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Thêm thông tin về thời gian cần để nhận cartridge tiếp theo
      const remainingSeconds = 600 - (totalVoice % 600);
      if (remainingSeconds < 600) {
        const remainingTime = formatTime(remainingSeconds);
        embed.addFields({
          name: '⏳ Thời Gian Cần Để Nhận Cartridge Tiếp Theo',
          value: `\`${remainingTime}\``,
          inline: false
        });
      }

      await safeEditReply(interaction({ embeds: [embed] });

    } catch (error) {
      console.error('[ERROR] Voicecheck command error:', error);
      try {
        await safeEditReply(interaction({
          content: '❌ Có lỗi xảy ra khi kiểm tra voice tracking. Vui lòng thử lại.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 