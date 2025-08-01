const { Events } = require('discord.js');

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
      
      // Only reply if the interaction hasn't been responded to yet
      // Be more conservative - only reply if we're absolutely sure it hasn't been handled
      const canReply = !interaction.replied && !interaction.deferred && !interaction.acknowledged;
      
      if (canReply) {
        try {
          await interaction.reply({ 
            content: 'Đã xảy ra lỗi khi xử lý lệnh.', 
            flags: 64 // Ephemeral flag
          });
        } catch (replyError) {
          // Don't log this error as it's expected when interaction is already acknowledged
          if (replyError.code !== 40060) {
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

      try {
        await command.execute(interaction, interaction.client);
      } catch (commandError) {
        console.error(`[ERROR] Command execution failed: ${interaction.commandName}`, commandError);
        throw commandError; // Re-throw to be caught by outer catch
      }
    }

    // Button handler
    else if (interaction.isButton()) {
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
        throw buttonError; // Re-throw to be caught by outer catch
      }
    }
  }
};

