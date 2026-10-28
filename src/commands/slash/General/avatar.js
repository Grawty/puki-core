const {
  SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType, ContainerBuilder, MessageFlags,
} = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show someone's avatar")
    // installable on a user's account too: works in servers, in DMs with the bot and in other DMs
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addUserOption((option) => option.setName("user").setDescription("Defaults to you")),
  options: { cooldown: 3 },
  run: async (client, interaction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });

    const container = new ContainerBuilder()
      .addTextDisplayComponents((text) => text.setContent(`### ${user.displayName}`))
      .addMediaGalleryComponents((gallery) => gallery.addItems((item) => item.setURL(url).setDescription(`${user.displayName}'s avatar`)));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
