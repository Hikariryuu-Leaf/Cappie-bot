const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    client.commands.set(command.data.name, command);
  }
}

function loadComponents(client) {
  const buttonFiles = fs.readdirSync('./components').filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const button = require(`../components/${file}`);
    client.buttons.set(button.name, button.execute);
  }
}

module.exports = { loadCommands, loadComponents };
