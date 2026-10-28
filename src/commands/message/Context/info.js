const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags, time, TimestampStyles } = require("discord.js");

module.exports = {
  structure: new ContextMenuCommandBuilder().setName("Message info").setType(ApplicationCommandType.Message),
  run: async (client, interaction) => {
    const message = interaction.targetMessage;
    const lines = [
      `**Author:** ${message.author.tag}`,
      `**Sent:** ${time(message.createdAt, TimestampStyles.RelativeTime)}`,
      `**Length:** ${message.content.length} characters`,
      `**Attachments:** ${message.attachments.size}`,
      `**Link:** ${message.url}`,
    ];
    await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  },
};
