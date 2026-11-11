const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("../config");
const { log } = require("../utils/logger");

// data/ is writable for the bot in Docker (see the Dockerfile) and kept in a volume across rebuilds
const CACHE_FILE = path.join(__dirname, "..", "..", "data", "deploy-cache.json");

const readCache = (file) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; }
};

function writeCache(file, cache) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(cache));
  } catch (error) {
    // the commands did go out; only the next start will send them again
    log(`Could not save ${file}, commands will be sent again on the next start: ${error.message}`, "warn");
  }
}

const routeFor = (guildId) => (guildId
  ? Routes.applicationGuildCommands(config.clientId, guildId)
  : Routes.applicationCommands(config.clientId));

/**
 * Sends the slash commands to Discord, but only when they changed since the last start:
 * registering the same list on every boot wastes the daily command-create limit.
 *
 * It also remembers where they went (GUILD_ID or global). Guild and global commands are shown
 * side by side, so after moving from a dev server to global the dev server would list every
 * command twice: the commands left on the old server are removed.
 */
const deploy = async (client, cacheFile = CACHE_FILE) => {
  const body = client.apiCommands.map((command) => (command.toJSON ? command.toJSON() : command));
  const guildId = config.devGuildId;
  const target = guildId || "global";
  const hash = crypto.createHash("sha256").update(JSON.stringify(body)).update(target).digest("hex");

  const cache = readCache(cacheFile);
  // an entry written by an older version is a bare hash string, with no record of where it went
  const previous = typeof cache[config.clientId] === "object" ? cache[config.clientId] : null;
  if (previous?.hash === hash) {
    log("Commands unchanged, nothing to send to Discord.", "info");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    await rest.put(routeFor(guildId), { body });
  } catch (error) {
    log(`Could not register commands: ${error.message}`, "err");
    return;
  }
  log(`Registered ${body.length} commands (${target}).`, "done");

  if (previous?.guildId && previous.guildId !== guildId) {
    try {
      await rest.put(routeFor(previous.guildId), { body: [] });
      log(`Removed the commands left on the previous GUILD_ID (${previous.guildId}).`, "done");
    } catch (error) {
      log(`Could not remove the commands on the previous GUILD_ID (${previous.guildId}): ${error.message}`, "warn");
    }
  } else if (previous && !previous.guildId && guildId) {
    log("Commands were registered globally before: on this server they will show twice. Use a separate application for development to avoid that.", "warn");
  }

  cache[config.clientId] = { hash, guildId };
  writeCache(cacheFile, cache);
};

module.exports = deploy;
module.exports.CACHE_FILE = CACHE_FILE;
