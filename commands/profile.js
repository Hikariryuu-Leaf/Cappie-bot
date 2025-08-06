const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath, emojiPath } = require('../config');
const { formatTime } = require('../utils/formatTime');
const config = require('../config');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem hồ sơ cá nhân của bạn'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Load data efficiently with timeout protection
      let users, emojiData;
      try {
        const loadPromise = Promise.all([
          loadJSON(userDataPath),
          loadJSON(emojiPath)
        ]);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Load operation timed out')), 5000);
        });
        
        [users, emojiData] = await Promise.race([loadPromise, timeoutPromise]);
      } catch (loadError) {
        console.error('[ERROR] Failed to load data for profile:', loadError);
        return await safeEditReply(interaction, {
          content: '❌ Không thể tải dữ liệu. Vui lòng thử lại sau.'
        });
      }
      
      const emoji = emojiData.emoji || config.defaultEmoji;

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

      // Tính top hạng theo voiceTime và cartridge - optimize for performance
      const userEntries = Object.entries(users);
      const sortedVoice = userEntries.sort((a, b) => (b[1].totalVoice || 0) - (a[1].totalVoice || 0));
      const sortedCart = userEntries.sort((a, b) => (b[1].cartridge || 0) - (a[1].cartridge || 0));

      const voiceRank = sortedVoice.findIndex(entry => entry[0] === userId) + 1;
      const cartRank = sortedCart.findIndex(entry => entry[0] === userId) + 1;

      const totalVoice = userData.totalVoice || 0;
      const voiceTimeFormatted = formatTime(totalVoice);

      const embed = new EmbedBuilder()
        .setColor(embedConfig.colors.profile)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`${emoji} Hồ sơ của bạn`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setImage(embedConfig.getBanner(interaction.user.id))
        .addFields(
          { name: `${embedConfig.emojis.profile.cartridge} Tổng Cartridge`, value: `\`${userData.cartridge} ${emoji}\``, inline: true },
          { name: `${embedConfig.emojis.profile.voice} Tổng voice`, value: `\`${voiceTimeFormatted}\``, inline: true },
          { name: `${embedConfig.emojis.profile.rank} Hạng Cartridge`, value: `Top \`${cartRank}\``, inline: true },
          { name: `${embedConfig.emojis.profile.voiceRank} Hạng Voice`, value: `Top \`${voiceRank}\``, inline: true }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('handleShop')
          .setLabel('🎁 Mở shop')
          .setStyle(ButtonStyle.Success)
      );

      await safeEditReply(interaction, {
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error('[ERROR] Profile command error:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi tải hồ sơ. Vui lòng thử lại.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
