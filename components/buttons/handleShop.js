const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../../utils/database');
const { emojiPath, shopDataPath } = require('../../config');
const config = require('../../config');
const embedConfig = require('../../config/embeds');
const { safeEditReply } = require('../../utils/interactionHelper');

module.exports = {
  customId: 'handleShop',

  async execute(interaction) {
    try {
      const shop = loadJSON(shopDataPath);
      const emojiData = loadJSON(emojiPath);
      const emoji = emojiData.emoji || config.defaultEmoji;

      const embed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.shop.title} Shop Đổi Quà`)
        .setColor(embedConfig.colors.shop)
        .setDescription('Chọn phần thưởng bạn muốn đổi từ Cartridge')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setImage(embedConfig.getBanner(interaction.user.id))
        .setFooter({ text: `Bạn có thể nhấn đổi nếu đủ Cartridge.` });

      const rows = [];
      const shopItems = Object.entries(shop);

      if (shopItems.length === 0) {
        embed.setDescription('❌ Hiện tại không có phần thưởng nào trong shop.');
        return await safeEditReply(interaction, {
          embeds: [embed]
        });
      }

      shopItems.forEach(([itemName, price], index) => {
        embed.addFields({
          name: `${embedConfig.emojis.shop.title} ${itemName}`,
          value: `${embedConfig.emojis.shop.price} Giá: \`${price} ${emoji}\``,
          inline: false
        });

        // Tạo nút đổi ứng với từng phần thưởng
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`buyitem_${index}`)
            .setLabel('Đổi')
            .setStyle(ButtonStyle.Primary)
        );
        rows.push(row);
      });

      await safeEditReply(interaction, {
        embeds: [embed],
        components: rows
      });
    } catch (err) {
      console.error('❌ Lỗi khi mở shop:', err);
      await safeEditReply(interaction, {
        content: 'Đã xảy ra lỗi khi mở shop. Vui lòng thử lại sau!'
      });
    }
  }
};

