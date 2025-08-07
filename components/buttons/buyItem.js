const { EmbedBuilder } = require('discord.js');
const { loadUser, saveUser, loadShop } = require('../../utils/database');
const config = require('../../config');
const embedConfig = require('../../config/embeds');
const { safeEditReply } = require('../../utils/interactionHelper');

module.exports = {
  customIdRegex: /^buyitem_(.+)$/,
  async execute(interaction) {
    const userId = interaction.user.id;
    const itemId = interaction.customId.split('_')[1];

    // Lấy user và shop từ MongoDB
    const [user, shop] = await Promise.all([
      loadUser(userId),
      loadShop()
    ]);
    const item = shop.find(i => i.itemId === itemId);
    if (!item) {
      return interaction.reply({ content: '❌ Vật phẩm không tồn tại.', ephemeral: true });
    }
    if ((user.cartridge || 0) < item.price) {
      return interaction.reply({ content: '❌ Bạn không đủ Cartridge để mua vật phẩm này.', ephemeral: true });
    }
    user.cartridge -= item.price;
    // Có thể thêm logic nhận vật phẩm vào đây
    await saveUser(user);
    await interaction.reply({ content: `✅ Bạn đã mua **${item.name}** với giá **${item.price}** Cartridge!`, ephemeral: true });
  }
};

