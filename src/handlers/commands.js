const path = require("path");
const { jsFiles, safeRequire } = require("../utils/files");
const { log } = require("../utils/logger");

const ROOT = path.join(__dirname, "..", "commands");

/**
 * The key a command is stored under in client.interactions. Discord lets a slash command, a user
 * menu and a message menu share a name, so the menus carry their type: "avatar" is the slash
 * command, "user:Show avatar" the menu.
 */
const interactionKey = (type, name) => (type === "slash" ? name : `${type}:${name}`);

/**
 * src/commands/<type>/<Category>/<name>.js
 *   slash, user, message: registered with Discord, `structure` is a discord.js builder
 *   prefix:               typed after the prefix, `structure` is { name, aliases? }
 */
const loadCommands = (client) => {
  for (const type of ["slash", "user", "message", "prefix"]) {
    for (const file of jsFiles(path.join(ROOT, type))) {
      const command = safeRequire(file);
      if (!command) continue;
      const name = command.structure?.name;

      if (!name || typeof command.run !== "function") {
        log(`Skipped ${path.relative(ROOT, file)}: it needs structure.name and run().`, "warn");
        continue;
      }
      command.category = path.basename(path.dirname(file));
      command.type = type;

      const key = interactionKey(type, name);
      const taken = type === "prefix" ? client.prefixCommands.has(name) : client.interactions.has(key);
      if (taken) {
        log(`Skipped ${path.relative(ROOT, file)}: another command is already called ${name}.`, "warn");
        continue;
      }

      if (type === "prefix") {
        client.prefixCommands.set(name, command);
        for (const alias of command.structure.aliases || []) client.aliases.set(alias, name);
      } else {
        client.interactions.set(key, command);
        client.apiCommands.push(command.structure);
      }
    }
  }
  log(`Loaded ${client.interactions.size} interaction and ${client.prefixCommands.size} text commands.`, "done");
};

module.exports = loadCommands;
module.exports.interactionKey = interactionKey;
