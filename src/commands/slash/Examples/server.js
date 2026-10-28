const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, time, TimestampStyles } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Information about this server")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) => sub.setName("info").setDescription("Show an overview"))
    // /server count members, /server count channels
    .addSubcommandGroup((group) => group
      .setName("count")
      .setDescription("Counters")
      .addSubcommand((sub) => sub.setName("members").setDescription("How many members"))
      .addSubcommand((sub) => sub.setName("channels").setDescription("How many channels"))),
  options: { guildOnly: true, cooldown: 5 },
  run: async (client, interaction) => {
    const { guild, options } = interaction;
    const group = options.getSubcommandGroup(false);
    const sub = options.getSubcommand();

    if (group === "count") {
      const total = sub === "members" ? guild.memberCount : guild.channels.cache.size;
      return interaction.reply(`${guild.name} has ${total.toLocaleString("en")} ${sub}.`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Members", value: guild.memberCount.toLocaleString("en"), inline: true },
        { name: "Created", value: time(guild.createdAt, TimestampStyles.LongDate), inline: true },
      )
      .setFooter({ text: `ID ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
