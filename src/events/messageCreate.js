const { PermissionFlagsBits } = require("discord.js");
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

/**
 * False when the bot can see that it may not write in this channel. Without the check every
 * command typed in a read-only channel ends as an error in the log and nothing for the user.
 * DMs, and channels whose permissions cannot be read, are given the benefit of the doubt.
 */
function canReply(message) {
  const me = message.guild?.members?.me;
  const permissions = me && message.channel?.permissionsFor?.(me);
  if (!permissions) return true;
  const send = message.channel.isThread?.() ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages;
  return permissions.has([PermissionFlagsBits.ViewChannel, send]);
}

module.exports = {
  event: "messageCreate",
  stripPrefix,
  canReply,
  run: async (client, message) => {
    if (message.author.bot) return;

    const prefix = prefixFor(message.guild?.id);
    const rest = stripPrefix(message.content, prefix, client.user?.id);
    if (rest === null) return;

    // only a mention, no command: tell them the prefix
    if (!rest.trim()) {
      if (message.content.startsWith(prefix) || !canReply(message)) return;
      return replies.info(message, `My prefix here is \`${prefix}\`. Try \`/help\` too.`);
    }

    const [word, ...args] = rest.trim().split(/\s+/);
    const name = client.aliases.get(word.toLowerCase()) || word.toLowerCase();
    const command = client.prefixCommands.get(name);
    if (!command || !canReply(message)) return;

    const userId = message.author.id;
    const problem = gate.check({ userId, guild: message.guild }, name, command.options, { warnOnce: true });
    if (problem === gate.QUIET) return;
    if (problem) return replies.fail(message, problem);

    try {
      await gate.run(userId, name, () => command.run(client, message, args));
    } catch (error) {
      log(error, "err");
      await replies.fail(message, "Something went wrong on my side.").catch(() => {});
    }
  },
};
