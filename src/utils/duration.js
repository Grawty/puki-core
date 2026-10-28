const UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };

/** "90s", "2h30m", "1d 12h" to milliseconds. null when the text is not made of number+unit pieces. */
function parseDuration(text) {
  const compact = String(text).toLowerCase().replace(/\s+/g, "");
  if (!/^(\d+[smhdw])+$/.test(compact)) return null;

  let total = 0;
  for (const [, amount, unit] of compact.matchAll(/(\d+)([smhdw])/g)) total += Number(amount) * UNITS[unit];
  return total;
}

/** 93_784_000 to "1d 2h 3m 4s" */
function formatDuration(ms) {
  const parts = [];
  let left = Math.round(ms / 1000);
  for (const [unit, size] of [["d", 86_400], ["h", 3600], ["m", 60], ["s", 1]]) {
    const amount = Math.floor(left / size);
    left -= amount * size;
    if (amount) parts.push(`${amount}${unit}`);
  }
  return parts.join(" ") || "0s";
}

module.exports = { parseDuration, formatDuration };
