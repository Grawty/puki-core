const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require("discord.js");

module.exports = {
  structure: new ContextMenuCommandBuilder().setName("Show avatar").setType(ApplicationCommandType.User),
  run: async (client, interaction) => {
    const url = interaction.targetUser.displayAvatarURL({ size: 1024 });
    await interaction.reply({ content: url, flags: MessageFlags.Ephemeral });
  },
};
