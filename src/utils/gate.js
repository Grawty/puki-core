const config = require("../config");
const cooldowns = require("./cooldowns");

/** Returned instead of a sentence when the command must not run and the user was already told why. */
const QUIET = Symbol("quiet");

/**
 * The checks every command goes through, whether it came from a slash command or a text message.
 * Returns a sentence for the user when the command must not run, or null when it may.
 *
 * Command options it understands:
 *   ownerOnly  only ids listed in OWNER_ID
 *   guildOnly  not in DMs
 *   cooldown   seconds between two uses by the same user
 *
 * With `warnOnce`, a cooldown is explained the first time only and later attempts get QUIET.
 * Text commands use it; an interaction always has to be answered, so they do not.
 */
function check({ userId, guild }, name, options = {}, { warnOnce = false } = {}) {
  if (options.ownerOnly && !config.owners.has(userId)) return "Only the bot owner can use this.";
  if (options.guildOnly && !guild) return "This only works in a server.";

  const left = cooldowns.hit(userId, name, (options.cooldown || 0) * 1000);
  if (left > 0) {
    if (warnOnce && !cooldowns.firstWarning(userId, name)) return QUIET;
    return `Slow down, try again in ${Math.ceil(left / 1000)}s.`;
  }
  return null;
}

/**
 * Runs a command that passed the gate. If it throws, the cooldown is given back before the error
 * goes on to the handler that tells the user: nobody should wait for a command that did not work.
 * Anything that must never run twice is guarded in the database, not by the cooldown (see /daily).
 */
async function run(userId, name, fn) {
  try {
    return await fn();
  } catch (error) {
    cooldowns.clear(userId, name);
    throw error;
  }
}

module.exports = { check, run, QUIET };
