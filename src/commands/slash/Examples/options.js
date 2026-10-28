const { SlashCommandBuilder, ChannelType } = require("discord.js");

// What a user sees for each kind of option, for the echo below
function describe(option) {
  if (option.attachment) return option.attachment.name;
  if (option.channel) return `#${option.channel.name}`;
  if (option.role) return `@${option.role.name}`;
  if (option.user) return option.user.tag;
  return String(option.value);
}

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("options")
    .setDescription("Every kind of slash command option, echoed back")
    .setDescriptionLocalizations({ tr: "Her tür slash komut seçeneği, geri yansıtılır" })
    // required options have to come before optional ones
    .addStringOption((o) => o.setName("text").setDescription("Free text, 1 to 100 characters").setMinLength(1).setMaxLength(100).setRequired(true))
    .addStringOption((o) => o.setName("color").setDescription("A fixed list of choices").addChoices(
      { name: "Red", value: "red" },
      { name: "Green", value: "green", name_localizations: { tr: "Yeşil" } },
      { name: "Blue", value: "blue" },
    ))
    .addStringOption((o) => o.setName("fruit").setDescription("Suggestions that change while you type").setAutocomplete(true))
    .addIntegerOption((o) => o.setName("count").setDescription("A whole number from 1 to 10").setMinValue(1).setMaxValue(10))
    .addNumberOption((o) => o.setName("ratio").setDescription("A decimal number from 0 to 1").setMinValue(0).setMaxValue(1))
    .addBooleanOption((o) => o.setName("loud").setDescription("True or false"))
    .addUserOption((o) => o.setName("user").setDescription("A member"))
    .addChannelOption((o) => o.setName("channel").setDescription("Text channels only").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addRoleOption((o) => o.setName("role").setDescription("A role"))
    .addMentionableOption((o) => o.setName("mentionable").setDescription("A user or a role"))
    .addAttachmentOption((o) => o.setName("file").setDescription("An uploaded file")),
  options: { cooldown: 3 },
  run: async (client, interaction) => {
    const lines = interaction.options.data.map((option) => `**${option.name}**: ${describe(option)}`);
    await interaction.reply({ content: lines.join("\n"), allowedMentions: { parse: [] } });
  },
};
