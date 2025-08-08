const { Events } = require('discord.js');
const { safeReply, safeDefer, safeEditReply, isInteractionValid, executeWithTimeout } = require('../utils/interactionHelper');
const errorLogger = require('../utils/errorLogger');
const { EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embeds');
const { validateColor, formatColorDisplay, hexToDecimal } = require('../utils/colorValidator');

module.exports = {
  name: Events.InteractionCreate,
  
  async execute(interaction) {
    // Add a flag to prevent multiple handling of the same interaction
    if (interaction._handled) {
      console.warn('[INTERACTION] Interaction already handled, skipping...');
      errorLogger.logInteraction(interaction, 'duplicate_handling', false, new Error('Interaction already handled'));
      return;
    }
    interaction._handled = true;

    // Log interaction start
    errorLogger.logInteraction(interaction, 'start', true);

    // Wrap the entire execution in a try-catch to handle any unhandled errors
    try {
      await this.handleInteraction(interaction);
      errorLogger.logInteraction(interaction, 'complete', true);
    } catch (error) {
      console.error('❌ Lỗi xử lý interaction (outer catch):', error);
      errorLogger.logError(error, { 
        interaction: {
          type: interaction.type,
          commandName: interaction.commandName || interaction.customId,
          userId: interaction.user?.id
        }
      });
      errorLogger.logInteraction(interaction, 'error', false, error);
      
      // Only try to reply if the interaction is still valid
      if (isInteractionValid(interaction)) {
        try {
          await safeReply(interaction, { 
            content: 'Đã xảy ra lỗi khi xử lý lệnh.',
            flags: 64 // Ephemeral flag
          });
        } catch (replyError) {
          // Don't log this error as it's expected when interaction is already acknowledged
          if (replyError.code !== 40060 && replyError.code !== 10062) {
            console.error('❌ Không thể gửi error reply:', replyError);
            errorLogger.logError(replyError, { context: 'error_reply_failed' });
          }
        }
      }
    }
  },

  async handleInteraction(interaction) {
    // Slash command
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`[WARN] Command not found: ${interaction.commandName}`);
        errorLogger.logInteraction(interaction, 'command_not_found', false, new Error(`Command not found: ${interaction.commandName}`));
        return;
      }

      // Check if interaction is still valid before proceeding
      if (!isInteractionValid(interaction)) {
        console.warn(`[WARN] Interaction not valid for command: ${interaction.commandName}`);
        errorLogger.logInteraction(interaction, 'invalid_interaction', false, new Error('Interaction not valid'));
        return;
      }

      // Defer reply to prevent timeout for commands that might take time
      // For commands that should be visible to everyone, don't use ephemeral flag
      const publicCommands = ['profile', 'topcartridge', 'topvoice'];
      const shouldBeEphemeral = !publicCommands.includes(interaction.commandName);
      
      const deferred = await safeDefer(interaction, { flags: shouldBeEphemeral ? 64 : 0 });
      
      // If defer failed, don't proceed with command execution
      if (!deferred) {
        console.warn(`[WARN] Failed to defer interaction for command: ${interaction.commandName}`);
        errorLogger.logInteraction(interaction, 'defer_failed', false, new Error('Failed to defer interaction'));
        return;
      }

      errorLogger.logInteraction(interaction, 'defer_success', true);

      try {
        // Execute command with timeout protection
        await executeWithTimeout(interaction, command, 10000); // Increased to 10 second timeout
        errorLogger.logInteraction(interaction, 'command_execution_success', true);
      } catch (commandError) {
        console.error(`[ERROR] Command execution failed: ${interaction.commandName}`, commandError);
        errorLogger.logError(commandError, { 
          context: 'command_execution',
          commandName: interaction.commandName 
        });
        errorLogger.logInteraction(interaction, 'command_execution_failed', false, commandError);
        
        // Try to send error message if interaction is still valid
        if (interaction.deferred && !interaction.replied) {
          try {
            await safeEditReply(interaction, {
              content: 'Đã xảy ra lỗi khi thực hiện lệnh.',
              flags: 64
            });
          } catch (editError) {
            console.error(`[ERROR] Failed to send error message for ${interaction.commandName}:`, editError);
            errorLogger.logError(editError, { context: 'error_message_failed' });
          }
        }
        
        throw commandError; // Re-throw to be caught by outer catch
      }
    }

    // Button handler
    else if (interaction.isButton()) {
      // Check if interaction is still valid before proceeding
      if (!isInteractionValid(interaction)) {
        console.warn(`[WARN] Interaction not valid for button: ${interaction.customId}`);
        errorLogger.logInteraction(interaction, 'invalid_button_interaction', false, new Error('Button interaction not valid'));
        return;
      }

      // Defer reply for button interactions too
      const deferred = await safeDefer(interaction, { flags: 64 });
      
      // If defer failed, don't proceed with button execution
      if (!deferred) {
        console.warn(`[WARN] Failed to defer interaction for button: ${interaction.customId}`);
        errorLogger.logInteraction(interaction, 'button_defer_failed', false, new Error('Failed to defer button interaction'));
        return;
      }

      errorLogger.logInteraction(interaction, 'button_defer_success', true);

      const [baseId] = interaction.customId.split('_');
      const handler = interaction.client.components.get(baseId);
      
      if (!handler) {
        // Try regex matching for buyitem buttons
        const buyItemHandler = interaction.client.components.get('buyitem');
        if (buyItemHandler && interaction.customId.match(/^buyitem_\d+$/)) {
          try {
            await executeWithTimeout(interaction, buyItemHandler, 8000); // 8 second timeout for buttons
            errorLogger.logInteraction(interaction, 'buyitem_execution_success', true);
          } catch (buttonError) {
            console.error(`[ERROR] Button execution failed: ${interaction.customId}`, buttonError);
            errorLogger.logError(buttonError, { 
              context: 'buyitem_execution',
              customId: interaction.customId 
            });
            errorLogger.logInteraction(interaction, 'buyitem_execution_failed', false, buttonError);
            
            // Try to send error message if interaction is still valid
            if (interaction.deferred && !interaction.replied) {
              try {
                await safeEditReply(interaction, {
                  content: 'Đã xảy ra lỗi khi xử lý nút.',
                  flags: 64
                });
              } catch (editError) {
                console.error(`[ERROR] Failed to send error message for button ${interaction.customId}:`, editError);
                errorLogger.logError(editError, { context: 'button_error_message_failed' });
              }
            }
            
            throw buttonError; // Re-throw to be caught by outer catch
          }
          return;
        }
        console.warn(`[WARN] Button handler not found: ${interaction.customId}`);
        errorLogger.logInteraction(interaction, 'button_handler_not_found', false, new Error(`Button handler not found: ${interaction.customId}`));
        return;
      }
      
      try {
        await executeWithTimeout(interaction, handler, 8000); // 8 second timeout for buttons
        errorLogger.logInteraction(interaction, 'button_execution_success', true);
      } catch (buttonError) {
        console.error(`[ERROR] Button execution failed: ${interaction.customId}`, buttonError);
        errorLogger.logError(buttonError, { 
          context: 'button_execution',
          customId: interaction.customId 
        });
        errorLogger.logInteraction(interaction, 'button_execution_failed', false, buttonError);
        
        // Try to send error message if interaction is still valid
        if (interaction.deferred && !interaction.replied) {
          try {
            await safeEditReply(interaction, {
              content: 'Đã xảy ra lỗi khi xử lý nút.',
              flags: 64
            });
          } catch (editError) {
            console.error(`[ERROR] Failed to send error message for button ${interaction.customId}:`, editError);
            errorLogger.logError(editError, { context: 'button_error_message_failed' });
          }
        }
        
        throw buttonError; // Re-throw to be caught by outer catch
      }
    }

    // Modal submit handler
    else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('customrole_modal_')) {
        const itemId = interaction.customId.split('_').pop();
        const userId = interaction.user.id;
        const client = interaction.client;
        const guild = interaction.guild;
        const member = await guild.members.fetch(userId);
        const [user, shop] = await Promise.all([
          require('../utils/database').loadUser(userId),
          require('../utils/database').loadShop()
        ]);
        const item = shop.find(i => i.itemId === itemId);
        if (!item) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Lỗi')
            .setColor(embedConfig.colors.error)
            .setDescription('Vật phẩm không tồn tại.')
            .setTimestamp();
          return await safeReply(interaction, { embeds: [errorEmbed], flags: 64 });
        }
        if ((user.cartridge || 0) < item.price) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Không đủ Cartridge')
            .setColor(embedConfig.colors.error)
            .setDescription(`Bạn cần **${item.price}** ${embedConfig.emojis.shop.price} để mua vật phẩm này.\nHiện tại: **${user.cartridge || 0}** ${embedConfig.emojis.shop.price}`)
            .setTimestamp();
          return await safeReply(interaction, { embeds: [errorEmbed], flags: 64 });
        }
        // Get modal data with enhanced validation
        const roleName = interaction.fields.getTextInputValue('role_name').trim();
        const roleColorInput = interaction.fields.getTextInputValue('role_color').trim();
        const roleDescription = interaction.fields.getTextInputValue('role_description')?.trim() || '';

        // Validate role name
        if (!roleName || roleName.length < 1 || roleName.length > 100) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Invalid Role Name')
            .setColor(embedConfig.colors.error)
            .setDescription('Role name must be between 1 and 100 characters.')
            .setTimestamp();
          return await safeReply(interaction, { embeds: [errorEmbed], flags: 64 });
        }

        // Validate color
        const colorValidation = validateColor(roleColorInput);
        if (!colorValidation.valid) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Invalid Color')
            .setColor(embedConfig.colors.error)
            .setDescription(`${colorValidation.error}\n\nExamples:\n• Hex: #FF0000, #00FF00\n• RGB: rgb(255,0,0)\n• Names: red, blue, purple, discord_blue`)
            .setTimestamp();
          return await safeReply(interaction, { embeds: [errorEmbed], flags: 64 });
        }

        const processedColor = colorValidation.color;
        const colorDecimal = hexToDecimal(processedColor);

        // Deduct cartridge and save user
        user.cartridge -= item.price;
        await require('../utils/database').saveUser(user);

        // Create enhanced confirmation embed for user
        const userEmbed = new EmbedBuilder()
          .setTitle('🎨 Custom Role Request Submitted!')
          .setColor(colorDecimal)
          .setDescription(`Your custom role request has been submitted successfully!`)
          .addFields(
            { name: '🏷️ Role Name', value: `\`${roleName}\``, inline: true },
            { name: '🎨 Color', value: formatColorDisplay(roleColorInput, processedColor), inline: true },
            { name: '💰 Cost', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: '💳 Remaining Balance', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setFooter({ text: `Request ID: ${userId} | Admin will contact you soon` })
          .setTimestamp();

        if (roleDescription) {
          userEmbed.addFields({ name: '📝 Additional Notes', value: roleDescription, inline: false });
        }

        await safeReply(interaction, { embeds: [userEmbed], flags: 64 });
        // Create enhanced log embed for admin
        const logEmbed = new EmbedBuilder()
          .setTitle('🎨 New Custom Role Request')
          .setColor(colorDecimal)
          .setDescription('A user has requested a custom role. Please review and create the role.')
          .addFields(
            { name: '👤 User', value: `<@${userId}> (${member.user.tag})`, inline: true },
            { name: '🆔 User ID', value: userId, inline: true },
            { name: '🏷️ Requested Role Name', value: `\`${roleName}\``, inline: true },
            { name: '🎨 Requested Color', value: formatColorDisplay(roleColorInput, processedColor) + '\n`' + processedColor + '` (' + colorDecimal + ')', inline: true },
            { name: '💰 Cartridge Paid', value: `${item.price} ${embedConfig.emojis.shop.price}`, inline: true },
            { name: '💳 User\'s Remaining Balance', value: `${user.cartridge} ${embedConfig.emojis.shop.price}`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
          .setFooter({ text: `Server: ${guild.name} | Request Time` })
          .setTimestamp();

        if (roleDescription) {
          logEmbed.addFields({ name: '📝 Additional Notes', value: roleDescription, inline: false });
        }

        // Add quick action instructions for admin
        logEmbed.addFields({
          name: '⚡ Quick Actions',
          value: `• Create role with name: \`${roleName}\`\n• Set color to: \`${processedColor}\`\n• Assign to: <@${userId}>`,
          inline: false
        });

        const config = require('../config');

        // Send to log channel
        if (config.logChannelId) {
          try {
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
              await logChannel.send({
                content: `🚨 **New Custom Role Request** from <@${userId}>`,
                embeds: [logEmbed]
              });
            }
          } catch (error) {
            console.error('Failed to send to log channel:', error);
          }
        }

        // Enhanced DM to owner
        if (config.ownerId) {
          try {
            const owner = await client.users.fetch(config.ownerId);
            await owner.send({
              content: `🎨 **New Custom Role Request**\n\nA user has requested a custom role in **${guild.name}**. Please review the details below:`,
              embeds: [logEmbed]
            });
          } catch (error) {
            console.error('Failed to send DM to owner:', error);
          }
        }
        return;
      }
    }
  }
};
