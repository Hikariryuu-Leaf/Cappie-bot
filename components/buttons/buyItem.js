const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
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
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi')
        .setColor(embedConfig.colors.error)
        .setDescription('Vật phẩm không tồn tại.')
        .setTimestamp();
      return safeEditReply(interaction, { embeds: [errorEmbed], ephemeral: true });
    }
    if ((user.cartridge || 0) < item.price) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Không đủ Cartridge')
        .setColor(embedConfig.colors.error)
        .setDescription(`Bạn cần **${item.price}** ${embedConfig.emojis.shop.price} để mua vật phẩm này.\nHiện tại: **${user.cartridge || 0}** ${embedConfig.emojis.shop.price}`)
        .setTimestamp();
      return safeEditReply(interaction, { embeds: [errorEmbed], ephemeral: true });
    }
    // Đặc biệt cho Role Custom: chỉ show modal, không làm gì thêm
    if (item.name === 'Role Custom') {
      const modal = new ModalBuilder()
        .setCustomId(`customrole_modal_${itemId}`)
        .setTitle('Yêu cầu Role Custom');
      const nameInput = new TextInputBuilder()
        .setCustomId('role_name')
        .setLabel('Tên Role bạn muốn')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const colorInput = new TextInputBuilder()
        .setCustomId('role_color')
        .setLabel('Màu Role (HEX, ví dụ: #ff0000)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(colorInput)
      );
      return await interaction.showModal(modal);
    }
    // Các item khác xử lý như cũ, chỉ dùng safeEditReply
    user.cartridge -= item.price;
    let logEmbed, userEmbed;
    try {
      if (item.name === 'Role độc quyền Cartridge') {
        if (!config.exclusiveRoleId) throw new Error('Chưa cấu hình EXCLUSIVE_ROLE_ID');
        await member.roles.add(config.exclusiveRoleId);
        userEmbed = new EmbedBuilder()
          .setTitle('✅ Nhận Role thành công!')
          .setColor(embedConfig.colors.success)
          .setDescription(`Bạn đã nhận **Role độc quyền Cartridge**!\nCartridge còn lại: **${user.cartridge}** ${embedConfig.emojis.shop.price}`)
          .setTimestamp();
        logEmbed = new EmbedBuilder()
          .setTitle('🎉 Role độc quyền đã được gán')
          .setColor(embedConfig.colors.success)
          .addFields(
            { name: 'User', value: `<@${userId}> (${member.user.tag})`, inline: true },
            { name: 'Cartridge đã trừ', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: 'Cartridge còn lại', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setTimestamp();
      } else if (item.name === '50K tiền mặt') {
        userEmbed = new EmbedBuilder()
          .setTitle('�� Yêu cầu đã ghi nhận')
          .setColor(embedConfig.colors.info)
          .setDescription('Yêu cầu nhận **50K tiền mặt** đã được ghi nhận.\nAdmin sẽ liên hệ bạn sớm!')
          .setTimestamp();
        logEmbed = new EmbedBuilder()
          .setTitle('💸 Yêu cầu 50K tiền mặt')
          .setColor(embedConfig.colors.info)
          .addFields(
            { name: 'User', value: `<@${userId}> (${member.user.tag})`, inline: true },
            { name: 'Cartridge đã trừ', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: 'Cartridge còn lại', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setTimestamp();
        if (config.ownerId) {
          const owner = await client.users.fetch(config.ownerId);
          await owner.send({ embeds: [logEmbed] });
        }
      } else if (item.name === 'Nitro Basic') {
        userEmbed = new EmbedBuilder()
          .setTitle('📩 Yêu cầu đã ghi nhận')
          .setColor(embedConfig.colors.info)
          .setDescription('Yêu cầu nhận **Nitro Basic** đã được ghi nhận.\nAdmin sẽ liên hệ bạn sớm!')
          .setTimestamp();
        logEmbed = new EmbedBuilder()
          .setTitle('✨ Yêu cầu Nitro Basic')
          .setColor(embedConfig.colors.info)
          .addFields(
            { name: 'User', value: `<@${userId}> (${member.user.tag})`, inline: true },
            { name: 'Cartridge đã trừ', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: 'Cartridge còn lại', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setTimestamp();
        if (config.ownerId) {
          const owner = await client.users.fetch(config.ownerId);
          await owner.send({ embeds: [logEmbed] });
        }
      } else {
        userEmbed = new EmbedBuilder()
          .setTitle('✅ Mua thành công!')
          .setColor(embedConfig.colors.success)
          .setDescription(`Bạn đã mua **${item.name}** với giá **${item.price}** ${embedConfig.emojis.shop.price}!\nCartridge còn lại: **${user.cartridge}** ${embedConfig.emojis.shop.price}`)
          .setTimestamp();
        logEmbed = new EmbedBuilder()
          .setTitle('🛒 Mua vật phẩm')
          .setColor(embedConfig.colors.success)
          .addFields(
            { name: 'User', value: `<@${userId}> (${member.user.tag})`, inline: true },
            { name: 'Vật phẩm', value: item.name, inline: true },
            { name: 'Cartridge đã trừ', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: 'Cartridge còn lại', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setTimestamp();
      }
      await saveUser(user);
      await safeEditReply(interaction, { embeds: [userEmbed], ephemeral: true });
      if (config.logChannelId) {
        const logChannel = await client.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (err) {
      user.cartridge += item.price;
      await saveUser(user);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi xảy ra')
        .setColor(embedConfig.colors.error)
        .setDescription(`Đã xảy ra lỗi: ${err.message}`)
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [errorEmbed], ephemeral: true });
    }
  }
};

