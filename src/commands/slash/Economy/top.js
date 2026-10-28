const { SlashCommandBuilder } = require("discord.js");
const { User } = require("../../../models");

module.exports = {
  structure: new SlashCommandBuilder().setName("top").setDescription("The ten richest people"),
  options: { cooldown: 10 },
  run: async (client, interaction) => {
    const rows = await User.findAll({ order: [["coins", "DESC"]], limit: 10 });
    if (!rows.length) return interaction.reply("Nobody has any coins yet. Try /daily.");

    const lines = rows.map((row, index) => `${index + 1}. <@${row.id}> · ${row.coins.toLocaleString("en")}`);
    await interaction.reply({ content: lines.join("\n"), allowedMentions: { parse: [] } });
  },
};
