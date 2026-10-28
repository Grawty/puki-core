const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("file")
    .setDescription("Get your text back as a .txt file")
    .addStringOption((o) => o.setName("text").setDescription("What goes in the file").setMaxLength(1000).setRequired(true)),
  options: { cooldown: 5 },
  run: async (client, interaction) => {
    const file = new AttachmentBuilder(Buffer.from(interaction.options.getString("text"), "utf8"), { name: "note.txt" });
    await interaction.reply({ content: "Here you go.", files: [file] });
  },
};
