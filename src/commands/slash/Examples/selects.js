const {
  SlashCommandBuilder, ActionRowBuilder, ChannelType, StringSelectMenuBuilder, UserSelectMenuBuilder,
  RoleSelectMenuBuilder, ChannelSelectMenuBuilder, MentionableSelectMenuBuilder,
} = require("discord.js");

// A select menu takes a whole action row, so five menus is the most one message can hold
const row = (menu) => new ActionRowBuilder().addComponents(menu);

function buildRows() {
  return [
    row(new StringSelectMenuBuilder()
      .setCustomId("demo:string")
      .setPlaceholder("Pick one or two fruits")
      .setMinValues(1)
      .setMaxValues(2)
      .addOptions(
        { label: "Apple", value: "apple", description: "Crunchy", emoji: "🍎" },
        { label: "Banana", value: "banana", description: "Yellow", emoji: "🍌" },
        { label: "Cherry", value: "cherry", description: "Small and red", emoji: "🍒" },
      )),
    row(new UserSelectMenuBuilder().setCustomId("demo:user").setPlaceholder("Pick up to 3 people").setMaxValues(3)),
    row(new RoleSelectMenuBuilder().setCustomId("demo:role").setPlaceholder("Pick a role")),
    row(new ChannelSelectMenuBuilder().setCustomId("demo:channel").setPlaceholder("Pick a text channel").setChannelTypes(ChannelType.GuildText)),
    row(new MentionableSelectMenuBuilder().setCustomId("demo:mentionable").setPlaceholder("Pick a person or a role")),
  ];
}

module.exports = {
  structure: new SlashCommandBuilder().setName("selects").setDescription("One of every select menu"),
  options: { cooldown: 5 },
  buildRows,
  run: async (client, interaction) => {
    await interaction.reply({ content: "Try them:", components: buildRows() });
  },
};
