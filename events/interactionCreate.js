const { Events } = require('discord.js');
const { safeReply, safeDefer, safeEditReply, isInteractionValid, executeWithTimeout } = require('../utils/interactionHelper');

module.exports = {
  name: Events.InteractionCreate,
  
  async execute(interaction) {
    // Add a flag to prevent multiple handling of the same interaction
    if (interaction._handled) {
      return;
    }
    interaction._handled = true;

    // Wrap the entire execution in a try-catch to handle any unhandled errors
    try {
      await this.handleInteraction(interaction);
    } catch (error) {
      console.error('❌ Lỗi xử lý interaction (outer catch):', error);
      
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
        return;
      }

      // Check if interaction is still valid before proceeding
      if (!isInteractionValid(interaction)) {
        console.warn(`[WARN] Interaction not valid for command: ${interaction.commandName}`);
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
        return;
      }

      try {
        // Execute command with timeout protection
        await executeWithTimeout(interaction, command, 8000); // 8 second timeout
      } catch (commandError) {
        console.error(`[ERROR] Command execution failed: ${interaction.commandName}`, commandError);
        
        // Try to send error message if interaction is still valid
        if (interaction.deferred) {
          try {
            await safeEditReply(interaction, {
              content: 'Đã xảy ra lỗi khi thực hiện lệnh.',
              flags: 64
            });
          } catch (editError) {
            console.error(`[ERROR] Failed to send error message for ${interaction.commandName}:`, editError);
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
        return;
      }

      // Defer reply for button interactions too
      const deferred = await safeDefer(interaction, { flags: 64 });
      
      // If defer failed, don't proceed with button execution
      if (!deferred) {
        console.warn(`[WARN] Failed to defer interaction for button: ${interaction.customId}`);
        return;
      }

      const [baseId] = interaction.customId.split('_');
      const handler = interaction.client.components.get(baseId);
      
      if (!handler) {
        // Try regex matching for buyitem buttons
        const buyItemHandler = interaction.client.components.get('buyitem');
        if (buyItemHandler && interaction.customId.match(/^buyitem_\d+$/)) {
          try {
            await buyItemHandler.execute(interaction, interaction.client);
          } catch (buttonError) {
            console.error(`[ERROR] Button execution failed: ${interaction.customId}`, buttonError);
            
            // Try to send error message if interaction is still valid
            if (interaction.deferred) {
              try {
                await safeEditReply(interaction, {
                  content: 'Đã xảy ra lỗi khi xử lý nút.',
                  flags: 64
                });
              } catch (editError) {
                console.error(`[ERROR] Failed to send error message for button ${interaction.customId}:`, editError);
              }
            }
            
            throw buttonError; // Re-throw to be caught by outer catch
          }
          return;
        }
        console.warn(`[WARN] Button handler not found: ${interaction.customId}`);
        return;
      }
      
      try {
        await handler.execute(interaction, interaction.client);
      } catch (buttonError) {
        console.error(`[ERROR] Button execution failed: ${interaction.customId}`, buttonError);
        
        // Try to send error message if interaction is still valid
        if (interaction.deferred) {
          try {
            await safeEditReply(interaction, {
              content: 'Đã xảy ra lỗi khi xử lý nút.',
              flags: 64
            });
          } catch (editError) {
            console.error(`[ERROR] Failed to send error message for button ${interaction.customId}:`, editError);
          }
        }
        
        throw buttonError; // Re-throw to be caught by outer catch
      }
    }
  }
};

