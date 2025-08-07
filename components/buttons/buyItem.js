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
    const guild = interaction.guild;
    const member = await guild.members.fetch(userId);
    const client = interaction.client;
    // Lấy user và shop từ MongoDB
    const [user, shop] = await Promise.all([
      loadUser(userId),
      loadShop()
    ]);
    const item = shop.find(i => i.itemId === itemId);
    if (!item) {
      return safeEditReply(interaction, { content: '❌ Vật phẩm không tồn tại.', ephemeral: true });
    }
    if ((user.cartridge || 0) < item.price) {
      return safeEditReply(interaction, { content: '❌ Bạn không đủ Cartridge để mua vật phẩm này.', ephemeral: true });
    }
    // Trừ cartridge trước, chỉ hoàn lại nếu lỗi
    user.cartridge -= item.price;
    let logMsg = '';
    try {
      if (item.name === 'Role độc quyền Cartridge') {
        // Gán role cho user
        if (!config.exclusiveRoleId) throw new Error('Chưa cấu hình EXCLUSIVE_ROLE_ID');
        await member.roles.add(config.exclusiveRoleId);
        logMsg = `🎉 <@${userId}> đã đổi **Role độc quyền Cartridge** (${item.price} Cartridge)`;
        await safeEditReply(interaction, { content: `✅ Bạn đã nhận **Role độc quyền Cartridge**!`, ephemeral: true });
      } else if (item.name === 'Role Custom') {
        // Yêu cầu nhập tên + màu role qua modal (chưa có modal, gửi hướng dẫn)
        await safeEditReply(interaction, { content: '📩 Vui lòng nhắn tin cho admin với tên và màu role bạn muốn. Bot sẽ gửi yêu cầu đến owner để xử lý!', ephemeral: true });
        logMsg = `📝 <@${userId}> yêu cầu **Role Custom** (${item.price} Cartridge). Hãy kiểm tra DM để nhận thông tin chi tiết.`;
        // DM owner
        if (config.ownerId) {
          const owner = await client.users.fetch(config.ownerId);
          await owner.send(`📝 User <@${userId}> (${member.user.tag}) vừa yêu cầu **Role Custom**. Hãy liên hệ để lấy tên + màu role!`);
        }
      } else if (item.name === '50K tiền mặt') {
        await safeEditReply(interaction, { content: '📩 Yêu cầu nhận 50K tiền mặt đã được ghi nhận. Admin sẽ liên hệ bạn sớm!', ephemeral: true });
        logMsg = `💸 <@${userId}> (${member.user.tag}) vừa đổi **50K tiền mặt** (${item.price} Cartridge)`;
        if (config.ownerId) {
          const owner = await client.users.fetch(config.ownerId);
          await owner.send(`💸 User <@${userId}> (${member.user.tag}) vừa đổi **50K tiền mặt**. Vui lòng xử lý!`);
        }
      } else if (item.name === 'Nitro Basic') {
        await safeEditReply(interaction, { content: '📩 Yêu cầu nhận Nitro Basic đã được ghi nhận. Admin sẽ liên hệ bạn sớm!', ephemeral: true });
        logMsg = `✨ <@${userId}> (${member.user.tag}) vừa đổi **Nitro Basic** (${item.price} Cartridge)`;
        if (config.ownerId) {
          const owner = await client.users.fetch(config.ownerId);
          await owner.send(`✨ User <@${userId}> (${member.user.tag}) vừa đổi **Nitro Basic**. Vui lòng xử lý!`);
        }
      } else {
        await safeEditReply(interaction, { content: `✅ Bạn đã mua **${item.name}** với giá **${item.price}** Cartridge!`, ephemeral: true });
        logMsg = `🛒 <@${userId}> vừa mua **${item.name}** (${item.price} Cartridge)`;
      }
      await saveUser(user);
      // Gửi log về kênh log nếu có
      if (config.logChannelId) {
        const logChannel = await client.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) await logChannel.send(logMsg);
      }
    } catch (err) {
      // Hoàn lại cartridge nếu lỗi
      user.cartridge += item.price;
      await saveUser(user);
      await safeEditReply(interaction, { content: `❌ Đã xảy ra lỗi: ${err.message}`, ephemeral: true });
    }
  }
};

