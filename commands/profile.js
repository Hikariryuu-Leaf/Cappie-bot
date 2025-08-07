const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadUser, loadAllUsers, loadEmojis } = require('../utils/database');
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

      // Load user và emoji từ MongoDB
      let user, emojiData;
      try {
        [user, emojiData] = await Promise.all([
          loadUser(userId),
          loadEmojis()
        ]);
      } catch (loadError) {
        console.error('[ERROR] Failed to load data for profile:', loadError);
        return await safeEditReply(interaction, {
          content: '❌ Không thể tải dữ liệu. Vui lòng thử lại sau.'
        });
      }

      // Lấy emoji mặc định
      let emoji = config.defaultEmoji;
      if (emojiData && emojiData.length > 0) {
        emoji = emojiData[0].emoji || emoji;
      }

      // Nếu user chưa có trong DB
      if (!user) {
        user = await loadUser(userId); // sẽ tự tạo user mới
      }

      // Lấy tất cả users để tính rank
      const allUsers = await loadAllUsers();
      // Sắp xếp theo totalVoice và cartridge
      const sortedVoice = [...allUsers].sort((a, b) => (b.totalVoice || 0) - (a.totalVoice || 0));
      const sortedCart = [...allUsers].sort((a, b) => (b.cartridge || 0) - (a.cartridge || 0));
      const voiceRank = sortedVoice.findIndex(u => u.userId === userId) + 1;
      const cartRank = sortedCart.findIndex(u => u.userId === userId) + 1;

      const totalVoice = user.totalVoice || 0;
      const voiceTimeFormatted = formatTime(totalVoice);

      const embed = new EmbedBuilder()
        .setColor(embedConfig.colors.profile)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`${emoji} Hồ sơ của bạn`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setImage(embedConfig.getBanner(interaction.user.id))
        .addFields(
          { name: `${embedConfig.emojis.profile.cartridge} Tổng Cartridge`, value: `\`${user.cartridge || 0} ${emoji}\``, inline: true },
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
