module.exports = {
  // Default banner for all embeds
  defaultBanner: 'https://cdn.discordapp.com/attachments/1342373535284330519/1400905468196687995/coo-mita-miside.gif',
  
  // User-specific banners
  userBanners: {},
  
  // Emojis for different commands
  emojis: {
    // Diemdanh command
    diemdanh: {
      success: '🎉',
      reward: '🎁',
      nitro: '💎',
      total: '📊',
      cooldown: '🕓'
    },
    
    // Profile command
    profile: {
      cartridge: '🎫',
      voice: '🕒',
      rank: '🥇',
      voiceRank: '🎙️'
    },
    
    // Top commands
    top: {
      cartridge: '💰',
      voice: '🎙️',
      rank: '#'
    },
    
    // Shop
    shop: {
      title: '🎁',
      price: '💸',
      buy: '🛒'
    }
  },
  
  // Colors for different embeds
  colors: {
    success: 0x00ff99,
    info: 0x3399ff,
    warning: 0xf1c40f,
    error: 0xe74c3c,
    shop: 0x00ffff,
    profile: 0x3399ff,
    top: 0xf1c40f,
    voice: 0x3498db
  },
  
  // Get banner for specific user
  getBanner(userId) {
    return this.userBanners[userId] || this.defaultBanner;
  },
  
  // Set banner for specific user
  setUserBanner(userId, bannerUrl) {
    this.userBanners[userId] = bannerUrl;
  },
  
  // Remove user banner
  removeUserBanner(userId) {
    delete this.userBanners[userId];
  }
}; 