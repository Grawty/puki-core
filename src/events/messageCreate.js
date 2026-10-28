const config = require("../config");
const gate = require("../utils/gate");
const replies = require("../utils/replies");
const { log } = require("../utils/logger");

module.exports = {
  event: "messageCreate",
  run: async (client, message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const [word, ...args] = message.content.slice(config.prefix.length).trim().split(/\s+/);
    const name = client.aliases.get(word.toLowerCase()) || word.toLowerCase();
    const command = client.prefixCommands.get(name);
    if (!command) return;

    const problem = gate.check({ userId: message.author.id, guild: message.guild }, name, command.options);
    if (problem) return replies.fail(message, problem);

    try {
      await command.run(client, message, args);
    } catch (error) {
      log(error, "err");
      await replies.fail(message, "Something went wrong on my side.").catch(() => {});
    }
  },
};
