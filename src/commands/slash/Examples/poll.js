const { SlashCommandBuilder } = require("discord.js");
const replies = require("../../../utils/replies");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Start a native Discord poll")
    .addStringOption((o) => o.setName("question").setDescription("What to ask").setMaxLength(300).setRequired(true))
    .addStringOption((o) => o.setName("answers").setDescription("2 to 10 answers, separated by commas").setRequired(true))
    .addIntegerOption((o) => o.setName("hours").setDescription("How long it stays open, default 24").setMinValue(1).setMaxValue(168))
    .addBooleanOption((o) => o.setName("multiple").setDescription("Allow more than one answer")),
  options: { cooldown: 10 },
  run: async (client, interaction) => {
    const answers = interaction.options.getString("answers").split(",").map((text) => text.trim()).filter(Boolean);
    if (answers.length < 2 || answers.length > 10) return replies.fail(interaction, "Give between 2 and 10 answers.");

    await interaction.reply({
      poll: {
        question: { text: interaction.options.getString("question") },
        answers: answers.map((text) => ({ text: text.slice(0, 55) })), // Discord's answer limit
        duration: interaction.options.getInteger("hours") || 24,
        allowMultiselect: interaction.options.getBoolean("multiple") ?? false,
      },
    });
  },
};
