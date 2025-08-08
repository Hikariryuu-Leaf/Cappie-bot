// utils/colorValidator.js

/**
 * Color validation and processing utility for Discord role colors
 */

// Common color names mapped to hex values
const COLOR_NAMES = {
  // Basic colors
  'red': '#FF0000',
  'green': '#00FF00',
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'lime': '#00FF00',
  'white': '#FFFFFF',
  'black': '#000000',
  'gray': '#808080',
  'grey': '#808080',
  
  // Discord-friendly colors
  'blurple': '#5865F2',
  'greyple': '#99AAB5',
  'dark_but_not_black': '#2C2F33',
  'not_quite_black': '#23272A',
  'discord_blue': '#5865F2',
  'discord_green': '#57F287',
  'discord_yellow': '#FEE75C',
  'discord_fuchsia': '#EB459E',
  'discord_red': '#ED4245',
  
  // Extended colors
  'aqua': '#00FFFF',
  'navy': '#000080',
  'teal': '#008080',
  'silver': '#C0C0C0',
  'maroon': '#800000',
  'olive': '#808000',
  'fuchsia': '#FF00FF',
  'crimson': '#DC143C',
  'gold': '#FFD700',
  'indigo': '#4B0082',
  'violet': '#EE82EE',
  'turquoise': '#40E0D0',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'khaki': '#F0E68C',
  'lavender': '#E6E6FA',
  'plum': '#DDA0DD',
  'orchid': '#DA70D6'
};

/**
 * Validates and processes color input
 * @param {string} colorInput - User input for color (hex, rgb, or color name)
 * @returns {Object} - { valid: boolean, color: string|null, error: string|null }
 */
function validateColor(colorInput) {
  if (!colorInput || typeof colorInput !== 'string') {
    return { valid: false, color: null, error: 'Color input is required' };
  }

  const input = colorInput.trim().toLowerCase();

  // Check if it's a color name
  if (COLOR_NAMES[input]) {
    return { valid: true, color: COLOR_NAMES[input], error: null };
  }

  // Check if it's a hex color (with or without #)
  const hexMatch = input.match(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    return { valid: true, color: `#${hex.toUpperCase()}`, error: null };
  }

  // Check if it's RGB format
  const rgbMatch = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
      return { valid: true, color: hex, error: null };
    } else {
      return { valid: false, color: null, error: 'RGB values must be between 0 and 255' };
    }
  }

  // If none of the formats match
  return { 
    valid: false, 
    color: null, 
    error: `Invalid color format. Use hex (#FF0000), RGB (rgb(255,0,0)), or color name (red, blue, etc.)` 
  };
}

/**
 * Converts hex color to decimal for Discord API
 * @param {string} hexColor - Hex color string (e.g., "#FF0000")
 * @returns {number} - Decimal color value
 */
function hexToDecimal(hexColor) {
  return parseInt(hexColor.replace('#', ''), 16);
}

/**
 * Gets a list of available color names
 * @returns {string[]} - Array of available color names
 */
function getAvailableColors() {
  return Object.keys(COLOR_NAMES).sort();
}

/**
 * Formats color for display in embeds
 * @param {string} colorInput - Original user input
 * @param {string} processedColor - Processed hex color
 * @returns {string} - Formatted display string
 */
function formatColorDisplay(colorInput, processedColor) {
  const input = colorInput.trim().toLowerCase();
  if (COLOR_NAMES[input]) {
    return `${input} (${processedColor})`;
  }
  return processedColor;
}

module.exports = {
  validateColor,
  hexToDecimal,
  getAvailableColors,
  formatColorDisplay,
  COLOR_NAMES
};
