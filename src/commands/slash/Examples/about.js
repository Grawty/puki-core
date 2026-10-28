const {
  SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, SeparatorBuilder,
  SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require("discord.js");

// Components V2: the whole message is built from layout pieces. With the IsComponentsV2 flag
// `content` and `embeds` are not allowed, text goes into TextDisplay pieces instead.
function buildAbout(client) {
  return new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## puki-core"),
          new TextDisplayBuilder().setContent("A discord.js v14 bot template."),
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL()).setDescription("Bot avatar")),
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents((text) => text.setContent(`-# ${client.guilds.cache.size} servers · ${client.interactions.size} interaction commands`))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Source").setStyle(ButtonStyle.Link).setURL("https://github.com/Grawty/puki-core"),
        new ButtonBuilder().setLabel("Puki").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/783252170120233001"),
      ),
    );
}

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("about")
    .setDescription("Show the bot card (Components V2)")
    .setDescriptionLocalizations({ tr: "Bot kartını göster (Components V2)" }),
  options: { cooldown: 5 },
  buildAbout,
  run: async (client, interaction) => {
    await interaction.reply({ components: [buildAbout(client)], flags: MessageFlags.IsComponentsV2 });
  },
};
