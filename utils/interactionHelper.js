// Helper function to safely reply to interactions
async function safeReply(interaction, options) {
  try {
    // Check if interaction is still valid
    if (!interaction || interaction.acknowledged) {
      console.warn('[INTERACTION] Interaction already acknowledged or invalid');
      return null;
    }

    // If interaction is deferred, use editReply
    if (interaction.deferred) {
      return await interaction.editReply(options);
    } else {
      // If not deferred, use reply
      return await interaction.reply(options);
    }
  } catch (error) {
    // Handle specific error codes
    if (error.code === 10062) {
      console.warn('[INTERACTION] Unknown interaction (likely timed out)');
      return null;
    } else if (error.code === 40060) {
      console.warn('[INTERACTION] Interaction already acknowledged');
      return null;
    } else if (error.code === 50001) {
      console.warn('[INTERACTION] Missing access');
      return null;
    } else {
      console.error('[ERROR] Failed to reply to interaction:', error);
      throw error;
    }
  }
}

// Helper function to safely defer an interaction
async function safeDefer(interaction, options = { flags: 64 }) {
  try {
    // Check if interaction is still valid
    if (!interaction || interaction.acknowledged) {
      console.warn('[INTERACTION] Interaction already acknowledged or invalid');
      return false;
    }

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply(options);
      return true;
    }
    return false;
  } catch (error) {
    // Handle specific error codes
    if (error.code === 10062) {
      console.warn('[INTERACTION] Unknown interaction (likely timed out)');
      return false;
    } else if (error.code === 40060) {
      console.warn('[INTERACTION] Interaction already acknowledged');
      return false;
    } else if (error.code === 50001) {
      console.warn('[INTERACTION] Missing access');
      return false;
    } else {
      console.error('[ERROR] Failed to defer interaction:', error);
      return false;
    }
  }
}

// Helper function to safely edit reply
async function safeEditReply(interaction, options) {
  try {
    // Check if interaction is still valid
    if (!interaction || !interaction.deferred) {
      console.warn('[INTERACTION] Cannot edit reply - interaction not deferred');
      return null;
    }

    return await interaction.editReply(options);
  } catch (error) {
    // Handle specific error codes
    if (error.code === 10062) {
      console.warn('[INTERACTION] Unknown interaction (likely timed out)');
      return null;
    } else if (error.code === 40060) {
      console.warn('[INTERACTION] Interaction already acknowledged');
      return null;
    } else if (error.code === 50001) {
      console.warn('[INTERACTION] Missing access');
      return null;
    } else {
      console.error('[ERROR] Failed to edit reply:', error);
      throw error;
    }
  }
}

// Helper function to check if interaction is still valid
function isInteractionValid(interaction) {
  return interaction && 
         !interaction.acknowledged && 
         !interaction.replied && 
         !interaction.deferred;
}

module.exports = {
  safeReply,
  safeDefer,
  safeEditReply,
  isInteractionValid
}; 