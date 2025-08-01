const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../../utils/database');
const { emojiPath, shopDataPath } = require('../../config');
const config = require('../../config');

module.exports = {
  customId: 'handleShop',

  async execute(interaction) {
    try {
      const shop = loadJSON(shopDataPath);
      const emojiData = loadJSON(emojiPath);
      const emoji = emojiData.emoji || config.defaultEmoji;

      const embed = new EmbedBuilder()
        .setTitle('🎁 Shop Đổi Quà')
        .setColor(0x00ffff)
        .setDescription('Chọn phần thưởng bạn muốn đổi từ Cartridge')
        .setFooter({ text: `Bạn có thể nhấn đổi nếu đủ Cartridge.` });

      const rows = [];
      const shopItems = Object.entries(shop);

      if (shopItems.length === 0) {
        embed.setDescription('❌ Hiện tại không có phần thưởng nào trong shop.');
        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      shopItems.forEach(([itemName, price], index) => {
        embed.addFields({
          name: `🎉 ${itemName}`,
          value: `💸 Giá: \`${price} ${emoji}\``,
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

      await interaction.reply({
        embeds: [embed],
        components: rows,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ Lỗi khi mở shop:', err);
      await interaction.reply({
        content: 'Đã xảy ra lỗi khi mở shop. Vui lòng thử lại sau!',
        ephemeral: true
      });
    }
  }
};

