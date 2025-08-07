require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands } = require('./utils/loader');
const voiceTracker = require('./jobs/voiceTracker');
const { initializeDatabase } = require('./utils/database');
const BackupManager = require('./utils/backupManager');
const PersistentStorage = require('./utils/persistentStorage');

// Tạo client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Tải lệnh slash
client.commands = new Collection();
loadCommands(client);

// Tải components (button handler)
client.components = new Collection();
const componentsPath = path.join(__dirname, 'components');
fs.readdirSync(componentsPath).forEach(folder => {
  const folderPath = path.join(componentsPath, folder);
  if (fs.lstatSync(folderPath).isDirectory()) {
    const componentFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of componentFiles) {
      const filePath = path.join(folderPath, file);
      const component = require(filePath);
      if (component.customId && component.execute) {
        client.components.set(component.customId, component);
      } else if (component.customIdRegex && component.execute) {
        // For regex-based components like buyitem
        client.components.set(component.customIdRegex.source.split('^')[1].split('_')[0], component);
      } else {
        console.warn(`[WARN] Component thiếu 'customId' hoặc 'execute' trong ${file}`);
      }
    }
  }
});

// Tải events
client.events = new Collection();
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.name && event.execute) {
    client.events.set(event.name, event);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[EVENT] Đã tải event: ${event.name}`);
  } else {
    console.warn(`[WARN] Event thiếu 'name' hoặc 'execute' trong ${file}`);
  }
}

// Ready event
client.once('ready', async () => {
  console.log(`[READY] Bot đăng nhập với tag: ${client.user.tag}`);
  
  try {
    // Initialize enhanced database system
    console.log('[STARTUP] Initializing database system...');
    initializeDatabase();
    
    // Initialize and start backup system
    console.log('[STARTUP] Initializing backup system...');
    const backupManager = new BackupManager();
    backupManager.startAutoBackup();
    client.backupManager = backupManager; // Make it available globally
    
    // Initialize persistent storage system
    console.log('[STARTUP] Initializing persistent storage system...');
    const persistentStorage = new PersistentStorage();
    persistentStorage.setupGracefulShutdown();
    persistentStorage.startAutoBackup();
    client.persistentStorage = persistentStorage; // Make it available globally
    
    // Start voice tracking
    console.log('[STARTUP] Starting voice tracking...');
    voiceTracker.start(client);
    
    console.log('[STARTUP] Bot startup completed successfully!');
  } catch (error) {
    console.error('[STARTUP] Error during startup:', error);
  }
});

// Interaction handling is now managed by events/interactionCreate.js

// Đăng nhập bot
client.login(process.env.TOKEN);

// Web service để giữ cho Render không tắt bot
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot đang hoạt động!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service đang chạy tại cổng ${PORT}`);
});
