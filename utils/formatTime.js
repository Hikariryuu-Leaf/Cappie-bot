// utils/formatTime.js

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours} giờ ${mins} phút`;
  } else {
    return `${mins} phút`;
  }
}

function formatMilliseconds(ms) {
  const minutes = Math.floor(ms / (1000 * 60));
  return formatTime(minutes);
}

module.exports = { formatTime, formatMilliseconds };
