const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadShop, loadEmojis } = require('../../utils/database');
const embedConfig = require('../../config/embeds');

module.exports = {
  customId: 'handleShop',
  async execute(interaction) {
    // Lấy shop và emoji từ MongoDB
    const [shop, emojis] = await Promise.all([
      loadShop(),
      loadEmojis()
    ]);
    const emoji = (emojis && emojis.length > 0) ? emojis[0].emoji : '🎁';
    if (!shop || shop.length === 0) {
      return interaction.followUp({ content: '❌ Shop hiện đang trống.', ephemeral: true });
    }
    // Tạo embed
    const embed = new EmbedBuilder()
      .setTitle(`${embedConfig.emojis.shop.title} SHOP ĐỔI QUÀ`)
      .setColor(embedConfig.colors.shop)
      .setDescription('Chọn phần quà bạn muốn đổi Cartridge để nhận:')
      .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
      .setTimestamp();
    // Thêm từng item vào embed
    shop.forEach(item => {
      embed.addFields({
        name: `${item.name}`,
        value: `${embedConfig.emojis.shop.price} Giá: **${item.price}** ${emoji}`,
        inline: false
      });
    });
    // Tạo các nút bấm cho từng item
    const rows = [];
    for (let i = 0; i < shop.length; i += 5) {
      const row = new ActionRowBuilder();
      shop.slice(i, i+5).forEach(item => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`buyitem_${item.itemId}`)
            .setLabel(`Đổi ${item.name}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(embedConfig.emojis.shop.buy)
        );
      });
      rows.push(row);
    }
    await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
  }
};

