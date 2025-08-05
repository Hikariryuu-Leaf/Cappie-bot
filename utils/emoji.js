const { loadJSON } = require('./database');
const { emojiPath } = require('../config');

function getEmoji() {
  const data = loadJSON(emojiPath);
  return data.emoji || '🧩';
}

module.exports = { getEmoji };
