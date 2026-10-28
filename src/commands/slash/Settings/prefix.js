const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require("discord.js");
const { prefixFor, prefixProblem, setPrefix, MAX_PREFIX_LENGTH } = require("../../../guildSettings");
const replies = require("../../../utils/replies");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Show or change the text command prefix of this server")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) => sub.setName("show").setDescription("Show the current prefix"))
    .addSubcommand((sub) => sub
      .setName("set")
      .setDescription("Change the prefix")
      .addStringOption((o) => o.setName("value").setDescription(`1 to ${MAX_PREFIX_LENGTH} characters, no spaces`).setMaxLength(MAX_PREFIX_LENGTH).setRequired(true)))
    .addSubcommand((sub) => sub.setName("reset").setDescription("Go back to the default prefix")),
  options: { guildOnly: true, cooldown: 5 },
  run: async (client, interaction) => {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "show") {
      return replies.info(interaction, `The prefix here is \`${prefixFor(guildId)}\`.`);
    }

    // Discord's default permission for a command can be overridden by server admins, so check here as well
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return replies.fail(interaction, "You need the Manage Server permission to change the prefix.");
    }

    if (sub === "reset") {
      await setPrefix(guildId, null);
      return replies.success(interaction, `The prefix is back to \`${prefixFor(guildId)}\`.`, { ephemeral: false });
    }

    const value = interaction.options.getString("value");
    const problem = prefixProblem(value);
    if (problem) return replies.fail(interaction, problem);

    await setPrefix(guildId, value);
    await replies.success(interaction, `The prefix is now \`${value}\`.`, { ephemeral: false });
  },
};
