module.exports = {
  // Default banner for all embeds
  defaultBanner: 'https://cdn.discordapp.com/attachments/1342373535284330519/1400905468196687995/coo-mita-miside.gif',
  
  // User-specific banners
  userBanners: {},
  
  // Emojis for different commands - Updated with server emoji IDs
  emojis: {
    // Diemdanh command
    diemdanh: {
      success: '<:Cartridge:1401296893736259614>',
      reward: '<:Cartridge:1401296893736259614>',
      nitro: '<a:Nitro:1401018696339816593>',
      total: '<:Cartridge:1401296893736259614>',
      cooldown: '<a:maruloader:1401014872929734736>'
    },
    
    // Profile command
    profile: {
      cartridge: '<:Cartridge:1401296893736259614>',
      voice: '<:voice:1401013403958640683>',
      rank: '<:crown~1:1401012799504908402>',
      voiceRank: '<:voice:1401013403958640683>'
    },
    
    // Top commands
    top: {
      cartridge: '<:Cartridge:1401296893736259614>',
      voice: '<:voice:1401013403958640683>',
      rank: '<:green_star2:1402704561172516884>'
    },
    
    // Shop
    shop: {
      title: '<a:Gift_Animation:1401017774028881921>',
      price: '<:Cartridge:1401296893736259614>',
      buy: '<:Cartridge:1401296893736259614>'
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