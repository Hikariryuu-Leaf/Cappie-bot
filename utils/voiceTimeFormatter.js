// utils/voiceTimeFormatter.js

/**
 * Formats milliseconds into human-readable time format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string (e.g., "2 hours 35 minutes")
 */
function formatVoiceTime(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '0 minutes';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  // Only show seconds if total time is less than 1 minute
  if (parts.length === 0 && seconds > 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }
  
  if (parts.length === 0) {
    return '0 minutes';
  }
  
  if (parts.length === 1) {
    return parts[0];
  }
  
  if (parts.length === 2) {
    return parts.join(' and ');
  }
  
  // For 3 or more parts, use commas and "and" for the last part
  const lastPart = parts.pop();
  return parts.join(', ') + ', and ' + lastPart;
}

/**
 * Formats milliseconds into compact time format for displays
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Compact formatted time (e.g., "2h 35m")
 */
function formatVoiceTimeCompact(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '0m';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days}d`);
  }
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (parts.length === 0) {
    return '0m';
  }
  
  return parts.join(' ');
}

/**
 * Calculates current voice session duration
 * @param {number} joinTime - Timestamp when user joined voice (in milliseconds)
 * @returns {number} - Current session duration in milliseconds
 */
function getCurrentSessionDuration(joinTime) {
  if (!joinTime || typeof joinTime !== 'number' || joinTime <= 0) {
    return 0;
  }
  
  return Date.now() - joinTime;
}

/**
 * Calculates total voice time including current session
 * @param {number} totalVoice - Total accumulated voice time in milliseconds
 * @param {number} joinTime - Current session start time (null if not in voice)
 * @returns {number} - Total voice time including current session
 */
function getTotalVoiceTime(totalVoice = 0, joinTime = null) {
  let total = totalVoice;
  
  if (joinTime && typeof joinTime === 'number' && joinTime > 0) {
    total += getCurrentSessionDuration(joinTime);
  }
  
  return total;
}

/**
 * Calculates how many cartridges should be earned from voice time
 * @param {number} voiceTimeMs - Voice time in milliseconds
 * @returns {number} - Number of cartridges earned (1 per 10 minutes)
 */
function calculateCartridgeFromVoice(voiceTimeMs) {
  const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds
  return Math.floor(voiceTimeMs / tenMinutesInMs);
}

module.exports = {
  formatVoiceTime,
  formatVoiceTimeCompact,
  getCurrentSessionDuration,
  getTotalVoiceTime,
  calculateCartridgeFromVoice
};
