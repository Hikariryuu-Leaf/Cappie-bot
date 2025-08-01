const { EmbedBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../../utils/database');
const { userDataPath, emojiPath, shopDataPath } = require('../../config');
const config = require('../../config');

module.exports = {
  customIdRegex: /^buyitem_\d+$/,

  async execute(interaction) {
    const match = interaction.customId.match(/^buyitem_(\d+)$/);
    if (!match) return;

    const itemIndex = parseInt(match[1]);
    const userId = interaction.user.id;
    const username = interaction.user.username;

    const users = loadJSON(userDataPath);
    const emojiData = loadJSON(emojiPath);
    const emoji = emojiData.emoji || config.defaultEmoji;
    const shop = loadJSON(shopDataPath);
    
    const shopItems = Object.entries(shop);
    const item = shopItems[itemIndex];

    if (!item) {
      return interaction.reply({ content: '❌ Phần thưởng không tồn tại.', ephemeral: true });
    }

    const [itemName, price] = item;
    const user = users[userId] || { cartridge: 0, totalVoice: 0 };
    
    if (user.cartridge < price) {
      return interaction.reply({
        content: `❌ Bạn không đủ ${emoji}. Cần ${price}, bạn có ${user.cartridge}.`,
        ephemeral: true
      });
    }

    // Trừ Cartridge
    user.cartridge -= price;
    users[userId] = user;
    saveJSON(userDataPath, users);

    const embed = new EmbedBuilder()
      .setTitle(`🎁 Đổi quà: ${itemName}`)
      .setColor(0x32cd32)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: 'Người đổi', value: `<@${userId}> (${userId})`, inline: true },
        { name: 'Phần thưởng', value: itemName, inline: true },
        { name: 'Giá', value: `${price} ${emoji}`, inline: true }
      )
      .setTimestamp();

    // Thực thi phần thưởng
    if (itemName.includes('Role độc quyền')) {
      try {
        const guild = interaction.guild;
        const member = await guild.members.fetch(userId);
        await member.roles.add(config.exclusiveRoleId);
        embed.addFields({ name: '✅ Thực thi', value: 'Đã thêm role độc quyền!', inline: false });
      } catch (error) {
        console.error('Lỗi khi thêm role:', error);
        embed.addFields({ name: '⚠️ Lỗi', value: 'Không thể thêm role. Vui lòng liên hệ admin.', inline: false });
      }
    } else {
      // Gửi thông báo đến Admin xử lý
      try {
        const ownerUser = await interaction.client.users.fetch(config.ownerId);
        await ownerUser.send(`📥 **[${itemName}]** - <@${userId}> (${username}) vừa đổi phần thưởng này.`);
        embed.addFields({ name: '📧 Thông báo', value: 'Đã gửi thông báo cho admin!', inline: false });
      } catch (error) {
        console.error('Lỗi khi gửi thông báo:', error);
      }
    }

    // Gửi log nếu có channel log
    if (config.logChannelId) {
      try {
        const logChannel = await interaction.client.channels.fetch(config.logChannelId);
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Lỗi khi gửi log:', error);
      }
    }

    await interaction.reply({
      content: `✅ Bạn đã đổi thành công phần thưởng **${itemName}** với giá **${price} ${emoji}**!`,
      ephemeral: true
    });
  }
};

