const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require("discord.js");
const { moderationProblem } = require("../../../utils/permissions");
const replies = require("../../../utils/replies");

const MAX_MINUTES = 28 * 24 * 60; // Discord's limit is 28 days

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Mute someone for a while")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("user").setDescription("Who to mute").setRequired(true))
    .addIntegerOption((option) => option.setName("minutes").setDescription("How long").setMinValue(1).setMaxValue(MAX_MINUTES).setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Shown in the audit log").setMaxLength(400)),
  options: { guildOnly: true, cooldown: 3 },
  run: async (client, interaction) => {
    const target = interaction.options.getMember("user");
    const minutes = interaction.options.getInteger("minutes");
    const reason = interaction.options.getString("reason") || "No reason given";

    const context = { guild: interaction.guild, member: interaction.member, me: interaction.guild.members.me };
    const problem = moderationProblem(context, target, PermissionFlagsBits.ModerateMembers);
    if (problem) return replies.fail(interaction, problem);

    await target.timeout(minutes * 60_000, `${interaction.user.tag}: ${reason}`);
    await replies.success(interaction, `${target.user.tag} is muted for ${minutes} minute(s).`, { ephemeral: false });
  },
};
