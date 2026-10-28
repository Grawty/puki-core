const { SlashCommandBuilder } = require("discord.js");
const { balanceOf } = require("../../../economy");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Show how many coins someone has")
    .addUserOption((option) => option.setName("user").setDescription("Defaults to you")),
  options: { cooldown: 3 },
  run: async (client, interaction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const coins = await balanceOf(user.id);
    await interaction.reply({ content: `${user.displayName} has ${coins.toLocaleString("en")} coins.`, allowedMentions: { parse: [] } });
  },
};
