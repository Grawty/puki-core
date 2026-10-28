const { MessageFlags } = require("discord.js");

module.exports = {
  customId: "feedback",
  run: async (client, interaction) => {
    const { fields } = interaction;

    const subject = fields.getTextInputValue("subject");
    const kind = fields.getRadioGroup("kind", true);
    const areas = fields.getCheckboxGroup("areas");
    const contact = fields.getCheckbox("contact");

    const lines = [
      `**Subject:** ${subject}`,
      `**Kind:** ${kind}`,
      `**Parts:** ${areas.join(", ") || "none"}`,
      `**May contact:** ${contact ? "yes" : "no"}`,
    ];
    await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  },
};
