const config = require("../config");
const cooldowns = require("./cooldowns");

/**
 * The checks every command goes through, whether it came from a slash command or a text message.
 * Returns a sentence for the user when the command must not run, or null when it may.
 *
 * Command options it understands:
 *   ownerOnly  only ids listed in OWNER_ID
 *   guildOnly  not in DMs
 *   cooldown   seconds between two uses by the same user
 */
function check({ userId, guild }, name, options = {}) {
  if (options.ownerOnly && !config.owners.has(userId)) return "Only the bot owner can use this.";
  if (options.guildOnly && !guild) return "This only works in a server.";

  const left = cooldowns.hit(userId, name, (options.cooldown || 0) * 1000);
  if (left > 0) return `Slow down, try again in ${Math.ceil(left / 1000)}s.`;
  return null;
}

module.exports = { check };
