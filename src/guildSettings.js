const { Op } = require("sequelize");
const config = require("./config");
const { Guild } = require("./models");

const MAX_PREFIX_LENGTH = 5;

// Every message asks for its server's prefix, so custom prefixes live in memory.
// A server is handled by exactly one shard, and so is its /prefix command, which keeps this Map right under sharding.
const prefixes = new Map();

/** A sentence for the user when the prefix is not acceptable, null when it is. */
function prefixProblem(prefix) {
  if (!prefix || prefix.length > MAX_PREFIX_LENGTH) return `The prefix must be 1 to ${MAX_PREFIX_LENGTH} characters.`;
  if (/\s/.test(prefix)) return "The prefix cannot contain spaces.";
  if (prefix.includes("`")) return "The prefix cannot contain a backtick.";
  return null;
}

/** Reads the custom prefixes from the database. Call once after connecting. */
async function loadPrefixes() {
  const rows = await Guild.findAll({ where: { prefix: { [Op.ne]: null } }, attributes: ["id", "prefix"], raw: true });
  prefixes.clear();
  for (const row of rows) prefixes.set(row.id, row.prefix);
  return rows.length;
}

/** The prefix for a server, or the default one (config.prefix) in DMs and for servers without their own. */
const prefixFor = (guildId) => (guildId && prefixes.get(guildId)) || config.prefix;

/** Saves a prefix, or clears it with null so the server goes back to the default. */
async function setPrefix(guildId, prefix) {
  await Guild.upsert({ id: guildId, prefix });
  if (prefix) prefixes.set(guildId, prefix);
  else prefixes.delete(guildId);
}

module.exports = { prefixProblem, loadPrefixes, prefixFor, setPrefix, MAX_PREFIX_LENGTH };
