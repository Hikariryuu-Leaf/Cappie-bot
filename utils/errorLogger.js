const fs = require('fs');
const path = require('path');

class ErrorLogger {
  constructor() {
    this.logDir = './logs';
    this.errorLogPath = path.join(this.logDir, 'errors.log');
    this.interactionLogPath = path.join(this.logDir, 'interactions.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorMessage = {
      timestamp,
      error: error.message,
      stack: error.stack,
      context
    };

    const logEntry = `[${timestamp}] ERROR: ${JSON.stringify(errorMessage, null, 2)}\n---\n`;
    
    try {
      fs.appendFileSync(this.errorLogPath, logEntry);
    } catch (writeError) {
      console.error('Failed to write to error log:', writeError);
    }

    console.error(`[ERROR] ${error.message}`, error);
  }

  logInteraction(interaction, action, success = true, error = null) {
    const timestamp = new Date().toISOString();
    const interactionData = {
      timestamp,
      type: interaction.type,
      commandName: interaction.commandName || interaction.customId,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      action,
      success,
      error: error?.message || null,
      interactionAge: Date.now() - interaction.createdTimestamp
    };

    const logEntry = `[${timestamp}] INTERACTION: ${JSON.stringify(interactionData, null, 2)}\n---\n`;
    
    try {
      fs.appendFileSync(this.interactionLogPath, logEntry);
    } catch (writeError) {
      console.error('Failed to write to interaction log:', writeError);
    }
  }

  logDatabaseOperation(operation, filePath, success = true, error = null) {
    const timestamp = new Date().toISOString();
    const dbData = {
      timestamp,
      operation,
      filePath,
      success,
      error: error?.message || null
    };

    const logEntry = `[${timestamp}] DATABASE: ${JSON.stringify(dbData, null, 2)}\n---\n`;
    
    try {
      fs.appendFileSync(this.errorLogPath, logEntry);
    } catch (writeError) {
      console.error('Failed to write to error log:', writeError);
    }
  }

  getRecentErrors(limit = 10) {
    try {
      if (!fs.existsSync(this.errorLogPath)) {
        return [];
      }

      const content = fs.readFileSync(this.errorLogPath, 'utf-8');
      const entries = content.split('---\n').filter(entry => entry.trim());
      return entries.slice(-limit);
    } catch (error) {
      console.error('Failed to read error log:', error);
      return [];
    }
  }

  getRecentInteractions(limit = 10) {
    try {
      if (!fs.existsSync(this.interactionLogPath)) {
        return [];
      }

      const content = fs.readFileSync(this.interactionLogPath, 'utf-8');
      const entries = content.split('---\n').filter(entry => entry.trim());
      return entries.slice(-limit);
    } catch (error) {
      console.error('Failed to read interaction log:', error);
      return [];
    }
  }

  clearLogs() {
    try {
      if (fs.existsSync(this.errorLogPath)) {
        fs.unlinkSync(this.errorLogPath);
      }
      if (fs.existsSync(this.interactionLogPath)) {
        fs.unlinkSync(this.interactionLogPath);
      }
      console.log('[LOGGER] Logs cleared successfully');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

module.exports = errorLogger; 