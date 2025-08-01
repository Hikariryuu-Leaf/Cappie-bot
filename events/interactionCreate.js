const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  
  async execute(interaction) {
    try {
      // Slash command
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.warn(`[WARN] Command not found: ${interaction.commandName}`);
          return;
        }

        await command.execute(interaction, interaction.client);
      }

      // Button handler
      else if (interaction.isButton()) {
        const [baseId] = interaction.customId.split('_');
        const handler = interaction.client.components.get(baseId);
        
        if (!handler) {
          // Try regex matching for buyitem buttons
          const buyItemHandler = interaction.client.components.get('buyitem');
          if (buyItemHandler && interaction.customId.match(/^buyitem_\d+$/)) {
            await buyItemHandler.execute(interaction, interaction.client);
            return;
          }
          console.warn(`[WARN] Button handler not found: ${interaction.customId}`);
          return;
        }
        
        await handler.execute(interaction, interaction.client);
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý interaction:', error);
      
      // Only reply if the interaction hasn't been responded to yet
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ 
            content: 'Đã xảy ra lỗi khi xử lý lệnh.', 
            flags: 64 // Ephemeral flag
          });
        } catch (replyError) {
          console.error('❌ Không thể gửi error reply:', replyError);
        }
      }
    }
  }
};

