const { MessageFlags } = require("discord.js");
const gate = require("../utils/gate");
const replies = require("../utils/replies");
const { log } = require("../utils/logger");

/** Exact customId first, then the part before the first ":" so a component can carry data ("ping:refresh"). */
const findComponent = (collection, customId) => collection.get(customId) || collection.get(customId.split(":")[0]);

async function runCommand(client, interaction) {
  const command = client.interactions.get(interaction.commandName);
  if (!command) return replies.fail(interaction, "That command is no longer available.");

  const problem = gate.check(
    { userId: interaction.user.id, guild: interaction.guild },
    interaction.commandName,
    command.options,
  );
  if (problem) return replies.fail(interaction, problem);

  await command.run(client, interaction);
}

async function runComponent(client, interaction) {
  let collection = null;
  if (interaction.isButton()) collection = client.components.buttons;
  else if (interaction.isAnySelectMenu()) collection = client.components.selects;
  else if (interaction.isModalSubmit()) collection = client.components.modals;
  if (!collection) return;

  const component = findComponent(collection, interaction.customId);
  if (component) await component.run(client, interaction);
}

module.exports = {
  event: "interactionCreate",
  run: async (client, interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        await client.components.autocomplete.get(interaction.commandName)?.run(client, interaction);
      } else if (interaction.isCommand()) {
        await runCommand(client, interaction);
      } else {
        await runComponent(client, interaction);
      }
    } catch (error) {
      log(error, "err");
      // never leave the user looking at "thinking..."
      if (interaction.isAutocomplete()) return;
      const payload = { content: "Something went wrong on my side.", flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
  },
};
