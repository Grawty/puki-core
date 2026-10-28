const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const row = () => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("ping:refresh").setLabel("Measure again").setStyle(ButtonStyle.Secondary),
);

module.exports = {
  structure: new SlashCommandBuilder().setName("ping").setDescription("Check that the bot is alive"),
  options: { cooldown: 3 },
  row,
  run: async (client, interaction) => {
    await interaction.reply({ content: `Pong! Gateway latency: ${client.ws.ping}ms`, components: [row()] });
  },
};
