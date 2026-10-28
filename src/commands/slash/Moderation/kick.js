const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require("discord.js");
const { moderationProblem } = require("../../../utils/permissions");
const replies = require("../../../utils/replies");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Remove someone from the server")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName("user").setDescription("Who to kick").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Shown in the audit log").setMaxLength(400)),
  options: { guildOnly: true, cooldown: 3 },
  run: async (client, interaction) => {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason given";

    const context = { guild: interaction.guild, member: interaction.member, me: interaction.guild.members.me };
    const problem = moderationProblem(context, target, PermissionFlagsBits.KickMembers);
    if (problem) return replies.fail(interaction, problem);

    await target.kick(`${interaction.user.tag}: ${reason}`);
    await replies.success(interaction, `Kicked ${target.user.tag}.`, { ephemeral: false });
  },
};
