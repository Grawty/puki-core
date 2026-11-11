const { ApplicationCommandType, MessageFlags } = require("discord.js");
const { interactionKey } = require("../handlers/commands");
const gate = require("../utils/gate");
const replies = require("../utils/replies");
const { log } = require("../utils/logger");

const MENU_TYPES = { [ApplicationCommandType.User]: "user", [ApplicationCommandType.Message]: "message" };

/** Where client.interactions keeps the command this interaction is for. */
const commandKey = (interaction) => interactionKey(MENU_TYPES[interaction.commandType] || "slash", interaction.commandName);

/** Exact customId first, then the part before the first ":" so a component can carry data ("ping:refresh"). */
const findComponent = (collection, customId) => collection.get(customId) || collection.get(customId.split(":")[0]);

async function runCommand(client, interaction) {
  const key = commandKey(interaction);
  const command = client.interactions.get(key);
  if (!command) return replies.fail(interaction, "That command is no longer available.");

  const userId = interaction.user.id;
  const problem = gate.check({ userId, guild: interaction.guild }, key, command.options);
  if (problem) return replies.fail(interaction, problem);

  await gate.run(userId, key, () => command.run(client, interaction));
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

/** A component may export `options` ({ ownerOnly, guildOnly, cooldown }), checked like a command's. */
async function runComponent(client, interaction) {
  let collection = null;
  if (interaction.isButton()) collection = client.components.buttons;
  else if (interaction.isAnySelectMenu()) collection = client.components.selects;
  else if (interaction.isModalSubmit()) collection = client.components.modals;
  if (!collection) return;

  const component = findComponent(collection, interaction.customId);
  if (!component) return;

  const userId = interaction.user.id;
  const key = `component:${component.customId}`;
  const problem = gate.check({ userId, guild: interaction.guild }, key, component.options);
  if (problem) return replies.fail(interaction, problem);

  await gate.run(userId, key, () => component.run(client, interaction));
}

module.exports = {
  event: "interactionCreate",
  commandKey,
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
