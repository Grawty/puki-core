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

/**
 * Sends the slash commands to Discord, but only when they changed since the last start:
 * registering the same list on every boot wastes the daily command-create limit.
 */
const deploy = async (client, cacheFile = CACHE_FILE) => {
  const body = client.apiCommands.map((command) => (command.toJSON ? command.toJSON() : command));
  const target = config.devGuildId || "global";
  const hash = crypto.createHash("sha256").update(JSON.stringify(body)).update(target).digest("hex");

  const cache = readCache(cacheFile);
  if (cache[config.clientId] === hash) {
    log("Commands unchanged, nothing to send to Discord.", "info");
    return;
  }

  try {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const route = config.devGuildId
      ? Routes.applicationGuildCommands(config.clientId, config.devGuildId)
      : Routes.applicationCommands(config.clientId);
    await rest.put(route, { body });
  } catch (error) {
    log(`Could not register commands: ${error.message}`, "err");
    return;
  }

  log(`Registered ${body.length} commands (${target}).`, "done");
  cache[config.clientId] = hash;
  writeCache(cacheFile, cache);
};

module.exports = deploy;
module.exports.CACHE_FILE = CACHE_FILE;
