const { loadShop, loadEmojis } = require('../../utils/database');

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
      return interaction.reply({ content: '❌ Shop hiện đang trống.', ephemeral: true });
    }
    let content = `**Shop hiện tại:**\n`;
    for (const item of shop) {
      content += `• ${item.name}: ${item.price} ${emoji}\n`;
    }
    await interaction.reply({ content, ephemeral: true });
  }
};

