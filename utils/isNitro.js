// utils/isNitro.js

function isNitro(member) {
  return member.premiumSince !== null;
}

function getNitroMultiplier(member) {
  return isNitro(member) ? 2 : 1;
}

module.exports = { isNitro, getNitroMultiplier };

