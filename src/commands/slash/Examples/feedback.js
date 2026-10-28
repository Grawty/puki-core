const {
  SlashCommandBuilder, ModalBuilder, LabelBuilder, TextInputStyle,
  RadioGroupOptionBuilder, CheckboxGroupOptionBuilder,
} = require("discord.js");

// Modals hold up to five top level pieces. Inputs go inside a Label, which carries the title and hint.
function buildModal() {
  return new ModalBuilder()
    .setCustomId("feedback")
    .setTitle("Send feedback")
    .addTextDisplayComponents((text) => text.setContent("Nothing you type here is stored."))
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Subject")
        .setTextInputComponent((input) => input.setCustomId("subject").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)),
      new LabelBuilder()
        .setLabel("What is it about?")
        .setRadioGroupComponent((group) => group.setCustomId("kind").setRequired(true).addOptions(
          new RadioGroupOptionBuilder().setLabel("A bug").setValue("bug").setDescription("Something is broken"),
          new RadioGroupOptionBuilder().setLabel("An idea").setValue("idea").setDescription("Something is missing"),
          new RadioGroupOptionBuilder().setLabel("Something else").setValue("other"),
        )),
      new LabelBuilder()
        .setLabel("Which parts?")
        .setDescription("Pick any that apply")
        .setCheckboxGroupComponent((group) => group.setCustomId("areas").setRequired(false).setMinValues(0).setMaxValues(3).addOptions(
          new CheckboxGroupOptionBuilder().setLabel("Commands").setValue("commands"),
          new CheckboxGroupOptionBuilder().setLabel("Economy").setValue("economy"),
          new CheckboxGroupOptionBuilder().setLabel("Moderation").setValue("moderation"),
        )),
      new LabelBuilder()
        .setLabel("You may contact me about this")
        .setCheckboxComponent((box) => box.setCustomId("contact").setDefault(false)),
    );
}

module.exports = {
  structure: new SlashCommandBuilder().setName("feedback").setDescription("Open a form with text, radio and checkbox inputs"),
  options: { cooldown: 10 },
  buildModal,
  run: async (client, interaction) => {
    await interaction.showModal(buildModal());
  },
};
