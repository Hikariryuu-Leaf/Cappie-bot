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

// Helper function to safely defer an interaction with timeout handling
async function safeDefer(interaction, options = { flags: 64 }) {
  try {
    // Check if interaction is still valid
    if (!interaction || interaction.acknowledged) {
      console.warn('[INTERACTION] Interaction already acknowledged or invalid');
      return false;
    }

    // Check if interaction is too old (more than 3 seconds)
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 3000) {
      console.warn(`[INTERACTION] Interaction too old (${interactionAge}ms) for command: ${interaction.commandName}`);
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

// Helper function to safely edit reply with timeout handling
async function safeEditReply(interaction, options) {
  try {
    // Check if interaction is still valid
    if (!interaction || !interaction.deferred) {
      console.warn('[INTERACTION] Cannot edit reply - interaction not deferred');
      return null;
    }

    // Check if interaction is too old (more than 15 seconds)
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 15000) {
      console.warn(`[INTERACTION] Interaction too old (${interactionAge}ms) for edit reply`);
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
  if (!interaction) return false;
  
  // Check if interaction is too old (more than 15 seconds)
  const interactionAge = Date.now() - interaction.createdTimestamp;
  if (interactionAge > 15000) {
    console.warn(`[INTERACTION] Interaction too old (${interactionAge}ms) for command: ${interaction.commandName}`);
    return false;
  }
  
  return !interaction.acknowledged && 
         !interaction.replied && 
         !interaction.deferred;
}

// Helper function to handle command execution with timeout
async function executeWithTimeout(interaction, command, timeout = 10000) {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.warn(`[TIMEOUT] Command ${interaction.commandName} took too long (>${timeout}ms)`);
      reject(new Error('Command execution timeout'));
    }, timeout);

    try {
      const result = await command.execute(interaction);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

module.exports = {
  safeReply,
  safeDefer,
  safeEditReply,
  isInteractionValid,
  executeWithTimeout
}; 