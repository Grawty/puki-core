const { SlashCommandBuilder, ModalBuilder, LabelBuilder, TextInputStyle, StringSelectMenuOptionBuilder } = require("discord.js");

// The pickers a modal can hold: user select, string select, file upload
function buildModal() {
  return new ModalBuilder()
    .setCustomId("report")
    .setTitle("Report someone")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Who?")
        .setUserSelectMenuComponent((menu) => menu.setCustomId("target").setMaxValues(1)),
      new LabelBuilder()
        .setLabel("Reason")
        .setStringSelectMenuComponent((menu) => menu.setCustomId("reason").addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Spam").setValue("spam"),
          new StringSelectMenuOptionBuilder().setLabel("Harassment").setValue("harassment"),
          new StringSelectMenuOptionBuilder().setLabel("Other").setValue("other"),
        )),
      new LabelBuilder()
        .setLabel("Details")
        .setTextInputComponent((input) => input.setCustomId("details").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(false)),
      new LabelBuilder()
        .setLabel("Screenshots")
        .setDescription("Up to 3 files")
        .setFileUploadComponent((upload) => upload.setCustomId("proof").setMaxValues(3).setRequired(false)),
    );
}

module.exports = {
  structure: new SlashCommandBuilder().setName("report").setDescription("Open a form with a user picker and file upload"),
  options: { cooldown: 10 },
  buildModal,
  run: async (client, interaction) => {
    await interaction.showModal(buildModal());
  },
};
