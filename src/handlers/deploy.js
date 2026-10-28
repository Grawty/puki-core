const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("../config");
const { log } = require("../utils/logger");

const CACHE_FILE = path.join(__dirname, "..", "..", ".deploy-cache.json");

const readCache = () => {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch { return {}; }
};

/**
 * Sends the slash commands to Discord, but only when they changed since the last start:
 * registering the same list on every boot wastes the daily command-create limit.
 */
module.exports = async (client) => {
  const body = client.apiCommands.map((command) => (command.toJSON ? command.toJSON() : command));
  const target = config.devGuildId || "global";
  const hash = crypto.createHash("sha256").update(JSON.stringify(body)).update(target).digest("hex");

  const cache = readCache();
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

    cache[config.clientId] = hash;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    log(`Registered ${body.length} commands (${target}).`, "done");
  } catch (error) {
    log(`Could not register commands: ${error.message}`, "err");
  }
};
