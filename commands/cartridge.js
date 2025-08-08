const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUser, saveUser, loadEmojis } = require('../utils/database');
const { safeEditReply } = require('../utils/interactionHelper');
const embedConfig = require('../config/embeds');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cartridge')
    .setDescription('Comprehensive Cartridge management system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add Cartridge points to a user (Admin only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user to add Cartridges to')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of Cartridges to add')
            .setMinValue(1)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check Cartridge balance for yourself or another user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to check balance for (optional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove Cartridge points from a user (Admin only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user to remove Cartridges from')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of Cartridges to remove')
            .setMinValue(1)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set exact Cartridge balance for a user (Admin only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user to set balance for')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Exact amount to set')
            .setMinValue(0)
            .setRequired(true))),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const emojis = await loadEmojis();
      const emoji = (emojis && emojis.length > 0) ? emojis[0].emoji : '🎁';

      switch (subcommand) {
        case 'add':
          await this.handleAdd(interaction, emoji);
          break;
        case 'check':
          await this.handleCheck(interaction, emoji);
          break;
        case 'remove':
          await this.handleRemove(interaction, emoji);
          break;
        case 'set':
          await this.handleSet(interaction, emoji);
          break;
        default:
          await safeEditReply(interaction, {
            content: '❌ Unknown subcommand.'
          });
      }
    } catch (error) {
      console.error('Error in cartridge command:', error);
      try {
        await safeEditReply(interaction, {
          content: '❌ An error occurred while executing the cartridge command.'
        });
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  },

  // Helper function to check if user is admin
  isAdmin(userId) {
    return userId === config.ownerId;
  },

  // Handle /cartridge add subcommand
  async handleAdd(interaction, emoji) {
    if (!this.isAdmin(interaction.user.id)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Access Denied')
        .setColor(embedConfig.colors.error)
        .setDescription('Only the server owner can use this command.')
        .setTimestamp();
      return await safeEditReply(interaction, { embeds: [errorEmbed] });
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      let userData = await loadUser(targetUser.id);
      const oldBalance = userData.cartridge || 0;
      userData.cartridge = oldBalance + amount;
      await saveUser(userData);

      const successEmbed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.profile.cartridge} Cartridge Added`)
        .setColor(embedConfig.colors.success)
        .setDescription(`Successfully added **${amount}** ${emoji} to ${targetUser.username}`)
        .addFields(
          { name: 'Previous Balance', value: `${oldBalance} ${emoji}`, inline: true },
          { name: 'Amount Added', value: `+${amount} ${emoji}`, inline: true },
          { name: 'New Balance', value: `${userData.cartridge} ${emoji}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `Admin: ${interaction.user.username}` })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in cartridge add:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setColor(embedConfig.colors.error)
        .setDescription('Failed to add Cartridges. Please try again.')
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  // Handle /cartridge check subcommand
  async handleCheck(interaction, emoji) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isOwnBalance = targetUser.id === interaction.user.id;

    try {
      const userData = await loadUser(targetUser.id);
      const balance = userData.cartridge || 0;

      const checkEmbed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.profile.cartridge} Cartridge Balance`)
        .setColor(embedConfig.colors.info)
        .setDescription(isOwnBalance ? 'Your current Cartridge balance:' : `${targetUser.username}'s Cartridge balance:`)
        .addFields(
          { name: 'Current Balance', value: `**${balance}** ${emoji}`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setFooter({ text: isOwnBalance ? 'Use /diemdanh daily to earn more!' : `Requested by ${interaction.user.username}` })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [checkEmbed] });
    } catch (error) {
      console.error('Error in cartridge check:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setColor(embedConfig.colors.error)
        .setDescription('Failed to check Cartridge balance. Please try again.')
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  // Handle /cartridge remove subcommand
  async handleRemove(interaction, emoji) {
    if (!this.isAdmin(interaction.user.id)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Access Denied')
        .setColor(embedConfig.colors.error)
        .setDescription('Only the server owner can use this command.')
        .setTimestamp();
      return await safeEditReply(interaction, { embeds: [errorEmbed] });
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      let userData = await loadUser(targetUser.id);
      const oldBalance = userData.cartridge || 0;
      userData.cartridge = Math.max(0, oldBalance - amount); // Cannot go below 0
      const actualRemoved = oldBalance - userData.cartridge;
      await saveUser(userData);

      const successEmbed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.profile.cartridge} Cartridge Removed`)
        .setColor(embedConfig.colors.warning)
        .setDescription(`Successfully removed **${actualRemoved}** ${emoji} from ${targetUser.username}`)
        .addFields(
          { name: 'Previous Balance', value: `${oldBalance} ${emoji}`, inline: true },
          { name: 'Amount Removed', value: `-${actualRemoved} ${emoji}`, inline: true },
          { name: 'New Balance', value: `${userData.cartridge} ${emoji}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `Admin: ${interaction.user.username}` })
        .setTimestamp();

      if (actualRemoved < amount) {
        successEmbed.addFields({
          name: '⚠️ Note',
          value: `Only ${actualRemoved} ${emoji} were removed (balance cannot go below 0)`,
          inline: false
        });
      }

      await safeEditReply(interaction, { embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in cartridge remove:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setColor(embedConfig.colors.error)
        .setDescription('Failed to remove Cartridges. Please try again.')
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  },

  // Handle /cartridge set subcommand
  async handleSet(interaction, emoji) {
    if (!this.isAdmin(interaction.user.id)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Access Denied')
        .setColor(embedConfig.colors.error)
        .setDescription('Only the server owner can use this command.')
        .setTimestamp();
      return await safeEditReply(interaction, { embeds: [errorEmbed] });
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      let userData = await loadUser(targetUser.id);
      const oldBalance = userData.cartridge || 0;
      userData.cartridge = amount;
      await saveUser(userData);

      const successEmbed = new EmbedBuilder()
        .setTitle(`${embedConfig.emojis.profile.cartridge} Cartridge Balance Set`)
        .setColor(embedConfig.colors.info)
        .setDescription(`Successfully set ${targetUser.username}'s balance to **${amount}** ${emoji}`)
        .addFields(
          { name: 'Previous Balance', value: `${oldBalance} ${emoji}`, inline: true },
          { name: 'New Balance', value: `${amount} ${emoji}`, inline: true },
          { name: 'Change', value: `${amount - oldBalance >= 0 ? '+' : ''}${amount - oldBalance} ${emoji}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `Admin: ${interaction.user.username}` })
        .setTimestamp();

      await safeEditReply(interaction, { embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in cartridge set:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setColor(embedConfig.colors.error)
        .setDescription('Failed to set Cartridge balance. Please try again.')
        .setTimestamp();
      await safeEditReply(interaction, { embeds: [errorEmbed] });
    }
  }
};