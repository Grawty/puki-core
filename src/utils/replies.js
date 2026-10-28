const { EmbedBuilder, MessageFlags } = require("discord.js");

const COLORS = { success: 0x57f287, error: 0xed4245, warning: 0xfee75c, info: 0x5865f2 };

const isInteraction = (target) => typeof target.isRepliable === "function";

/**
 * Answers an interaction or a message, whichever it is, and picks reply, editReply or
 * followUp from the interaction's state so callers never have to track it.
 */
async function send(target, kind, text, { ephemeral = true } = {}) {
  const payload = { embeds: [new EmbedBuilder().setColor(COLORS[kind]).setDescription(text)] };

  if (!isInteraction(target)) {
    return target.reply({ ...payload, allowedMentions: { repliedUser: false } });
  }
  if (target.deferred && !target.replied) return target.editReply(payload);
  const body = ephemeral ? { ...payload, flags: MessageFlags.Ephemeral } : payload;
  return target.replied ? target.followUp(body) : target.reply(body);
}

module.exports = {
  fail: (target, text, options) => send(target, "error", text, options),
  warn: (target, text, options) => send(target, "warning", text, options),
  info: (target, text, options) => send(target, "info", text, options),
  success: (target, text, options) => send(target, "success", text, options),
};
