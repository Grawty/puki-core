const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder().setName("status").setDescription("Process details (owner only)"),
  // ownerOnly checks the ids listed in OWNER_ID
  options: { ownerOnly: true },
  run: async (client, interaction) => {
    const memory = process.memoryUsage().rss / 1024 / 1024;
    const lines = [
      `Uptime: ${Math.floor(process.uptime() / 60)} min`,
      `Memory: ${memory.toFixed(0)} MB`,
      `Servers: ${client.guilds.cache.size}`,
      `Ping: ${client.ws.ping}ms`,
    ];
    await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral });
  },
};
