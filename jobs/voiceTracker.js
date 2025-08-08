const { loadAllUsers, saveUser, loadUser } = require('../utils/database');
const { formatVoiceTime, getCurrentSessionDuration } = require('../utils/voiceTimeFormatter');

// Enhanced voice tracking function
async function trackVoiceTime(userId, timeToAdd) {
  try {
    let user = await loadUser(userId);
    user.totalVoice = (user.totalVoice || 0) + timeToAdd;
    await saveUser(user);
    console.log(`[VOICE TRACKER] Added ${Math.floor(timeToAdd / 60000)} minutes to user ${userId}`);
  } catch (error) {
    console.error(`[VOICE TRACKER] Error tracking time for user ${userId}:`, error);
  }
}

// Enhanced voice reward job - runs every 10 minutes to check for rewards
function startVoiceRewardJob() {
  console.log('[VOICE REWARD] Starting enhanced voice reward system...');

  setInterval(async () => {
    try {
      const users = await loadAllUsers();
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

      for (const user of users) {
        // Check if user is currently in voice and has been for at least 10 minutes
        if (typeof user.joinTime === 'number' && user.joinTime > 0) {
          const currentSessionTime = now - user.joinTime;

          // Award cartridge for every complete 10-minute interval
          if (currentSessionTime >= tenMinutes) {
            const intervalsCompleted = Math.floor(currentSessionTime / tenMinutes);

            if (intervalsCompleted > 0) {
              // Award cartridges for completed intervals
              user.cartridge = (user.cartridge || 0) + intervalsCompleted;

              // Update joinTime to reflect the rewarded time
              user.joinTime = now - (currentSessionTime % tenMinutes);

              await saveUser(user);

              const sessionDuration = formatVoiceTime(currentSessionTime);
              console.log(`[VOICE REWARD] +${intervalsCompleted} cartridge(s) for user ${user.userId} (session: ${sessionDuration})`);
            }
          }
        }
      }
    } catch (err) {
      console.error('[VOICE REWARD JOB] Error:', err);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
}

module.exports = { trackVoiceTime, startVoiceRewardJob };
