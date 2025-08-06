const { Events } = require('discord.js');
const { safeReply, safeDefer, safeEditReply, isInteractionValid, executeWithTimeout } = require('../utils/interactionHelper');
const errorLogger = require('../utils/errorLogger');

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
  }
};

