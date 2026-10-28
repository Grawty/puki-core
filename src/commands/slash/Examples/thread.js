const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, ThreadAutoArchiveDuration } = require("discord.js");
const replies = require("../../../utils/replies");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("thread")
    .setDescription("Start a thread under the bot's reply")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) => o.setName("name").setDescription("Thread title").setMaxLength(100).setRequired(true)),
  options: { guildOnly: true, cooldown: 10 },
  run: async (client, interaction) => {
    const me = interaction.guild.members.me;
    if (!interaction.channel.permissionsFor(me).has(PermissionFlagsBits.CreatePublicThreads)) {
      return replies.fail(interaction, "I can't create threads in this channel.");
    }

    const response = await interaction.reply({ content: "Thread coming up.", withResponse: true });
    await response.resource.message.startThread({
      name: interaction.options.getString("name"),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    });
  },
};
