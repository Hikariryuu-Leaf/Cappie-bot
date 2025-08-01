// Helper function to safely reply to interactions
async function safeReply(interaction, options) {
  try {
    // If interaction is deferred, use editReply
    if (interaction.deferred) {
      return await interaction.editReply(options);
    } else {
      // If not deferred, use reply
      return await interaction.reply(options);
    }
  } catch (error) {
    console.error('[ERROR] Failed to reply to interaction:', error);
    throw error;
  }
}

// Helper function to safely defer an interaction
async function safeDefer(interaction, options = { flags: 64 }) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply(options);
    }
  } catch (error) {
    // If already replied or deferred, ignore the error
    if (error.code !== 40060) {
      console.error('[ERROR] Failed to defer interaction:', error);
    }
  }
}

module.exports = {
  safeReply,
  safeDefer
}; 