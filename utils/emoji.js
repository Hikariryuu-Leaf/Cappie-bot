const { loadEmojis } = require('./database');

async function getEmoji() {
  const emojis = await loadEmojis();
  return (emojis && emojis.length > 0) ? emojis[0].emoji : '🎁';
}

module.exports = { getEmoji };
