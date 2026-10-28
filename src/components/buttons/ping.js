const { row } = require("../../commands/slash/General/ping");

module.exports = {
  customId: "ping",
  run: async (client, interaction) => {
    await interaction.update({ content: `Pong! Gateway latency: ${client.ws.ping}ms`, components: [row()] });
  },
};
