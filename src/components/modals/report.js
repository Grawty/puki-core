const { MessageFlags } = require("discord.js");

module.exports = {
  customId: "report",
  run: async (client, interaction) => {
    const { fields } = interaction;

    const target = fields.getSelectedUsers("target", true).first();
    const [reason] = fields.getStringSelectValues("reason");
    const details = fields.getTextInputValue("details");
    const files = fields.getUploadedFiles("proof"); // null when nothing was attached

    const lines = [
      `**Target:** ${target.tag}`,
      `**Reason:** ${reason}`,
      `**Details:** ${details || "none"}`,
      `**Files:** ${files ? [...files.values()].map((file) => file.name).join(", ") : "none"}`,
    ];
    await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  },
};
