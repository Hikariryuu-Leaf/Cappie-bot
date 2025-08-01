const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath, emojiPath } = require('../config');
const { isNitro, getNitroMultiplier } = require('../utils/isNitro');
const config = require('../config');
const embedConfig = require('../config/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diemdanh')
    .setDescription('Nhận Cartridge mỗi 24h (1–100, hoặc 1–200 nếu có Nitro)'),

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

    const lastClaim = users[userId].lastClaim || 0;
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 giờ

    if (now - lastClaim < cooldown) {
      const remaining = cooldown - (now - lastClaim);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);

      return interaction.reply({
        content: `${embedConfig.emojis.diemdanh.cooldown} Bạn đã điểm danh rồi. Hãy quay lại sau **${hours}h ${minutes}m**.`,
        flags: 64 // Ephemeral flag
      });
    }

    // Tính phần thưởng
    const hasNitro = isNitro(interaction.member);
    const maxReward = hasNitro ? 200 : 100;
    const reward = Math.floor(Math.random() * maxReward) + 1;

    users[userId].cartridge += reward;
    users[userId].lastClaim = now;
    saveJSON(userDataPath, users);

    const embed = new EmbedBuilder()
      .setColor(embedConfig.colors.success)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`${embedConfig.emojis.diemdanh.success} Điểm danh thành công!`)
      .setDescription(`Bạn đã nhận được **${reward} Cartridge** ${emoji}!\nTổng Cartridge: **${users[userId].cartridge}**`)
      .setThumbnail(embedConfig.getBanner(interaction.user.id))
      .setImage(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
      .addFields(
        { name: `${embedConfig.emojis.diemdanh.reward} Phần thưởng`, value: `${reward} ${emoji}`, inline: true },
        { name: `${embedConfig.emojis.diemdanh.nitro} Nitro Bonus`, value: hasNitro ? '✅ Có' : '❌ Không', inline: true },
        { name: `${embedConfig.emojis.diemdanh.total} Tổng Cartridge`, value: `${users[userId].cartridge} ${emoji}`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: 64 }); // Ephemeral flag
  }
};
