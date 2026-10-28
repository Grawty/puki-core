const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const row = (disabled = false) => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("confirm:yes").setLabel("Yes").setStyle(ButtonStyle.Danger).setDisabled(disabled),
  new ButtonBuilder().setCustomId("confirm:no").setLabel("No").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
);

// A button that is only meaningful inside this one command can be awaited right here
// instead of getting its own file under src/components/buttons.
module.exports = {
  structure: new SlashCommandBuilder().setName("confirm").setDescription("Ask for a yes or no with buttons"),
  options: { cooldown: 5 },
  run: async (client, interaction) => {
    const response = await interaction.reply({ content: "Are you sure?", components: [row()], withResponse: true });
    const message = response.resource.message;

    try {
      const click = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 15_000,
      });
      await click.update({ content: click.customId === "confirm:yes" ? "Done." : "Cancelled.", components: [row(true)] });
    } catch {
      await interaction.editReply({ content: "No answer, cancelled.", components: [row(true)] });
    }
  },
};
