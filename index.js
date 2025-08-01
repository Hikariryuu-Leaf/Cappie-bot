require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands } = require('./utils/loader');
const voiceTracker = require('./jobs/voiceTracker');

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
client.once('ready', () => {
  console.log(`[READY] Bot đăng nhập với tag: ${client.user.tag}`);
  voiceTracker.start(client);
});

// Xử lý lệnh slash
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`[ERROR] Thực thi lệnh ${interaction.commandName}:`, error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Đã xảy ra lỗi khi xử lý lệnh này.', ephemeral: true });
      }
    }
  }

  // Xử lý component (nút)
  if (interaction.isButton()) {
    const [baseId] = interaction.customId.split('_');
    const handler = client.components.get(baseId);
    if (!handler) return;
    try {
      await handler.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Lỗi xử lý button ${interaction.customId}:`, error);
    }
  }
});

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
