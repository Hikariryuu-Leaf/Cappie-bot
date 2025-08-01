const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  
  async execute(interaction) {
    try {
      // Slash command
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

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
          return;
        }
        
        await handler.execute(interaction, interaction.client);
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý interaction:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: 'Đã xảy ra lỗi khi xử lý lệnh.', 
          ephemeral: true 
        });
      }
    }
  }
};

