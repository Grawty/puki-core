const { PermissionFlagsBits } = require("discord.js");

/**
 * Everything that has to be true before a moderator action on `target` (a GuildMember) goes ahead.
 * Returns a sentence for the user, or null when the action is allowed.
 *
 * `needs` is the permission bit the action requires, from both the moderator and the bot.
 */
function moderationProblem({ guild, member: actor, me }, target, needs) {
  if (!actor.permissions.has(needs)) return "You don't have the permission for that.";
  if (!me.permissions.has(needs)) return "I don't have the permission for that.";
  if (!target) return "That person isn't in this server.";
  if (target.id === actor.id) return "You can't do that to yourself.";
  if (target.id === guild.ownerId) return "The server owner can't be moderated.";
  if (target.id === me.id) return "Nice try.";

  const actorIsOwner = actor.id === guild.ownerId;
  if (!actorIsOwner && target.roles.highest.position >= actor.roles.highest.position) {
    return "That person's highest role is not below yours.";
  }
  if (target.roles.highest.position >= me.roles.highest.position) {
    return "That person's highest role is not below mine.";
  }
  return null;
}

module.exports = { moderationProblem, PermissionFlagsBits };
