const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../utils/database');
const { userDataPath, emojiPath, shopDataPath } = require('../config');
const errorLogger = require('../utils/errorLogger');
const { safeEditReply } = require('../utils/interactionHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Debug bot status and check for issues'),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🔧 Bot Debug Information')
        .setColor(0x00ff00)
        .setTimestamp();

      // Check data files
      const dataChecks = [];
      try {
        const users = loadJSON(userDataPath);
        dataChecks.push(`✅ Users data: ${Object.keys(users).length} users`);
      } catch (error) {
        dataChecks.push(`❌ Users data: ${error.message}`);
      }

      try {
        const emojis = loadJSON(emojiPath);
        dataChecks.push(`✅ Emojis data: Loaded successfully`);
      } catch (error) {
        dataChecks.push(`❌ Emojis data: ${error.message}`);
      }

      try {
        const shop = loadJSON(shopDataPath);
        dataChecks.push(`✅ Shop data: ${Object.keys(shop).length} items`);
      } catch (error) {
        dataChecks.push(`❌ Shop data: ${error.message}`);
      }

      // Get recent errors
      const recentErrors = errorLogger.getRecentErrors(5);
      const recentInteractions = errorLogger.getRecentInteractions(5);

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memInfo = [
        `Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        `Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        `RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`
      ];

      // Check uptime
      const uptime = process.uptime();
      const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

      embed.addFields(
        { name: '📊 Data Status', value: dataChecks.join('\n'), inline: false },
        { name: '💾 Memory Usage', value: memInfo.join('\n'), inline: true },
        { name: '⏱️ Uptime', value: uptimeFormatted, inline: true },
        { name: '🔍 Recent Errors', value: recentErrors.length > 0 ? `${recentErrors.length} errors logged` : 'No recent errors', inline: true },
        { name: '🎯 Recent Interactions', value: `${recentInteractions.length} interactions logged`, inline: true }
      );

      // Add error details if any
      if (recentErrors.length > 0) {
        const errorDetails = recentErrors.slice(-3).map((entry, index) => {
          try {
            const data = JSON.parse(entry.replace(/^\[.*?\] ERROR: /, ''));
            return `${index + 1}. ${data.error} (${data.context?.commandName || data.context?.customId || 'unknown'})`;
          } catch {
            return `${index + 1}. Parse error`;
          }
        }).join('\n');
        
        embed.addFields({ name: '❌ Latest Errors', value: errorDetails, inline: false });
      }

      // Add interaction details
      if (recentInteractions.length > 0) {
        const interactionDetails = recentInteractions.slice(-3).map((entry, index) => {
          try {
            const data = JSON.parse(entry.replace(/^\[.*?\] INTERACTION: /, ''));
            return `${index + 1}. ${data.commandName || data.customId} - ${data.action} (${data.success ? '✅' : '❌'})`;
          } catch {
            return `${index + 1}. Parse error`;
          }
        }).join('\n');
        
        embed.addFields({ name: '🎯 Latest Interactions', value: interactionDetails, inline: false });
      }

      // Check for common issues
      const issues = [];
      
      // Check if there are too many errors
      if (recentErrors.length > 10) {
        issues.push('⚠️ High error rate detected');
      }

      // Check memory usage
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        issues.push('⚠️ High memory usage');
      }

      // Check uptime
      if (uptime < 300) { // Less than 5 minutes
        issues.push('⚠️ Bot recently restarted');
      }

      if (issues.length > 0) {
        embed.addFields({ name: '⚠️ Issues Detected', value: issues.join('\n'), inline: false });
        embed.setColor(0xff9900);
      }

      await safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('[ERROR] Debug command error:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ Có lỗi xảy ra khi chạy debug command.'
        });
      } catch (replyError) {
        console.error('Không thể gửi thông báo lỗi:', replyError);
      }
    }
  }
}; 