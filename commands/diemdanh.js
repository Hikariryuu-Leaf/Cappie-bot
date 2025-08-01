const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath, emojiPath } = require('../config');
const { isNitro, getNitroMultiplier } = require('../utils/isNitro');
const config = require('../config');

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
        content: `🕓 Bạn đã điểm danh rồi. Hãy quay lại sau **${hours}h ${minutes}m**.`,
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
      .setColor(0x00ff99)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`${emoji} Điểm danh thành công!`)
      .setDescription(`Bạn đã nhận được **${reward} Cartridge** ${emoji}!\nTổng Cartridge: **${users[userId].cartridge}**`)
      .addFields(
        { name: '🎁 Phần thưởng', value: `${reward} ${emoji}`, inline: true },
        { name: '💎 Nitro Bonus', value: hasNitro ? '✅ Có' : '❌ Không', inline: true },
        { name: '📊 Tổng Cartridge', value: `${users[userId].cartridge} ${emoji}`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: 64 }); // Ephemeral flag
  }
};
