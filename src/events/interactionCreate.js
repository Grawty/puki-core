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

/** A component may export `options` ({ ownerOnly, guildOnly, cooldown }), checked like a command's. */
async function gateComponent(interaction, name, options) {
  const problem = gate.check({ userId: interaction.user.id, guild: interaction.guild }, `component:${name}`, options);
  if (problem) await replies.fail(interaction, problem);
  return !problem;
}

async function runAutocomplete(client, interaction) {
  const handler = client.components.autocomplete.get(interaction.commandName);
  if (!handler) return;

  // suggestions for an owner-only command would leak what it does; no cooldown, typing fires this constantly
  const options = { ...client.interactions.get(interaction.commandName)?.options, cooldown: 0 };
  const problem = gate.check({ userId: interaction.user.id, guild: interaction.guild }, interaction.commandName, options);
  if (problem) return interaction.respond([]);

  await handler.run(client, interaction);
}

async function runComponent(client, interaction) {
  let collection = null;
  if (interaction.isButton()) collection = client.components.buttons;
  else if (interaction.isAnySelectMenu()) collection = client.components.selects;
  else if (interaction.isModalSubmit()) collection = client.components.modals;
  if (!collection) return;

  const component = findComponent(collection, interaction.customId);
  if (!component) return;
  if (!(await gateComponent(interaction, component.customId, component.options))) return;
  await component.run(client, interaction);
}

module.exports = {
  event: "interactionCreate",
  run: async (client, interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        await runAutocomplete(client, interaction);
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
