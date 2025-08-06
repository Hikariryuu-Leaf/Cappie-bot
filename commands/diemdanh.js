const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON, saveJSON } = require('../utils/database');
const { userDataPath, emojiPath } = require('../config');
const { isNitro, getNitroMultiplier } = require('../utils/isNitro');
const config = require('../config');
const embedConfig = require('../config/embeds');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diemdanh')
    .setDescription('Nhận Cartridge mỗi 24h (1–100, hoặc 1–200 nếu có Nitro)'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Load data efficiently with timeout protection
      let users, emojiData;
      try {
        [users, emojiData] = await Promise.all([
          loadJSON(userDataPath),
          loadJSON(emojiPath)
        ]);
      } catch (loadError) {
        console.error('[ERROR] Failed to load data for diemdanh:', loadError);
        return await safeEditReply(interaction, {
          content: '❌ Không thể tải dữ liệu. Vui lòng thử lại sau.'
        });
      }
      
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

        return await safeEditReply(interaction, {
          content: `${embedConfig.emojis.diemdanh.cooldown} Bạn đã điểm danh rồi. Hãy quay lại sau **${hours}h ${minutes}m**.`
        });
      }

      // Tính phần thưởng
      const hasNitro = isNitro(interaction.member);
      const maxReward = hasNitro ? 200 : 100;
      const reward = Math.floor(Math.random() * maxReward) + 1;

      users[userId].cartridge += reward;
      users[userId].lastClaim = now;
      
      // Save data efficiently with timeout
      try {
        const savePromise = saveJSON(userDataPath, users);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Save operation timed out')), 5000);
        });
        
        await Promise.race([savePromise, timeoutPromise]);
      } catch (saveError) {
        console.error('[ERROR] Failed to save data for diemdanh:', saveError);
        return await safeEditReply(interaction, {
          content: '❌ Không thể lưu dữ liệu. Vui lòng thử lại sau.'
        });
      }

      const embed = new EmbedBuilder()
        .setColor(embedConfig.colors.success)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`${embedConfig.emojis.diemdanh.success} Điểm danh thành công!`)
        .setDescription(`Bạn đã nhận được **${reward} Cartridge** ${emoji}!\nTổng Cartridge: **${users[userId].cartridge}**`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256, format: 'png' }))
        .setImage(embedConfig.getBanner(interaction.user.id))
        .addFields(
          { name: `${embedConfig.emojis.diemdanh.reward} Phần thưởng`, value: `${reward} ${emoji}`, inline: true },
          { name: `${embedConfig.emojis.diemdanh.nitro} Nitro Bonus`, value: hasNitro ? '✅ Có' : '❌ Không', inline: true },
          { name: `${embedConfig.emojis.diemdanh.total} Tổng Cartridge`, value: `${users[userId].cartridge} ${emoji}`, inline: true }
        )
        .setTimestamp();

      return await safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('[ERROR] Diemdanh command error:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi điểm danh. Vui lòng thử lại.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
};
