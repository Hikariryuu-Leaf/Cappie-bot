const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath, emojiPath } = require('../config');
const { formatTime } = require('../utils/formatTime');
const config = require('../config');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem hồ sơ cá nhân của bạn'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const users = loadJSON(userDataPath);
    const emojiData = loadJSON(emojiPath);
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

    // Tính top hạng theo voiceTime và cartridge
    const sortedVoice = Object.entries(users).sort((a, b) => (b[1].totalVoice || 0) - (a[1].totalVoice || 0));
    const sortedCart = Object.entries(users).sort((a, b) => (b[1].cartridge || 0) - (a[1].cartridge || 0));

    const voiceRank = sortedVoice.findIndex(entry => entry[0] === userId) + 1;
    const cartRank = sortedCart.findIndex(entry => entry[0] === userId) + 1;

    const totalVoice = userData.totalVoice || 0;
    const voiceTimeFormatted = formatTime(totalVoice);

    const embed = new EmbedBuilder()
      .setColor(embedConfig.colors.profile)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`${emoji} Hồ sơ của bạn`)
      .setThumbnail(embedConfig.getBanner(interaction.user.id))
      .setImage(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
      .addFields(
        { name: `${embedConfig.emojis.profile.cartridge} Tổng Cartridge`, value: `\`${userData.cartridge} ${emoji}\``, inline: true },
        { name: `${embedConfig.emojis.profile.voice} Tổng voice`, value: `\`${voiceTimeFormatted}\``, inline: true },
        { name: `${embedConfig.emojis.profile.rank} Hạng Cartridge`, value: `Top \`${cartRank}\``, inline: true },
        { name: `${embedConfig.emojis.profile.voiceRank} Hạng Voice`, value: `Top \`${voiceRank}\``, inline: true }
      )
      .setFooter({ text: 'Sử dụng nút bên dưới để mở shop đổi thưởng' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('handleShop')
        .setLabel('🎁 Mở shop')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
      // Removed ephemeral flag to make it public
    });
  }
};
