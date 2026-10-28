const path = require("path");
const { jsFiles } = require("../utils/files");
const { log } = require("../utils/logger");

const ROOT = path.join(__dirname, "..", "commands");

/**
 * src/commands/<type>/<Category>/<name>.js
 *   slash, user, message: registered with Discord, `structure` is a discord.js builder
 *   prefix:               typed after the prefix, `structure` is { name, aliases? }
 */
module.exports = (client) => {
  for (const type of ["slash", "user", "message", "prefix"]) {
    for (const file of jsFiles(path.join(ROOT, type))) {
      const command = require(file);
      const name = command.structure?.name;

      if (!name || typeof command.run !== "function") {
        log(`Skipped ${path.relative(ROOT, file)}: it needs structure.name and run().`, "warn");
        continue;
      }
      command.category = path.basename(path.dirname(file));
      command.type = type;

      if (type === "prefix") {
        client.prefixCommands.set(name, command);
        for (const alias of command.structure.aliases || []) client.aliases.set(alias, name);
      } else {
        client.interactions.set(name, command);
        client.apiCommands.push(command.structure);
      }
    }
  }
  log(`Loaded ${client.interactions.size} interaction and ${client.prefixCommands.size} text commands.`, "done");
};
