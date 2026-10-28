const gate = require("../utils/gate");
const replies = require("../utils/replies");
const { prefixFor } = require("../guildSettings");
const { log } = require("../utils/logger");

/**
 * What is left of a message after the prefix, or null when it does not start with one.
 * Mentioning the bot works as a prefix too, so nobody gets locked out by forgetting a custom one.
 */
function stripPrefix(content, prefix, botId) {
  const mention = botId && new RegExp(`^<@!?${botId}>\\s*`);
  if (mention && mention.test(content)) return content.replace(mention, "");
  return content.startsWith(prefix) ? content.slice(prefix.length) : null;
}

module.exports = {
  event: "messageCreate",
  stripPrefix,
  run: async (client, message) => {
    if (message.author.bot) return;

    const prefix = prefixFor(message.guild?.id);
    const rest = stripPrefix(message.content, prefix, client.user?.id);
    if (rest === null) return;

    // only a mention, no command: tell them the prefix
    if (!rest.trim()) {
      if (message.content.startsWith(prefix)) return;
      return replies.info(message, `My prefix here is \`${prefix}\`. Try \`/help\` too.`);
    }

    const [word, ...args] = rest.trim().split(/\s+/);
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
