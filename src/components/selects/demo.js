const { MessageFlags } = require("discord.js");

// One file answers every "demo:<kind>" menu: the loader matches the part before the colon
const names = (collection, format) => [...collection.values()].map(format);

module.exports = {
  customId: "demo",
  run: async (client, interaction) => {
    const kind = interaction.customId.split(":")[1];

    let picked;
    if (kind === "string") picked = interaction.values;
    else if (kind === "user") picked = names(interaction.users, (user) => user.tag);
    else if (kind === "role") picked = names(interaction.roles, (role) => `@${role.name}`);
    else if (kind === "channel") picked = names(interaction.channels, (channel) => `#${channel.name}`);
    else picked = [...names(interaction.users, (user) => user.tag), ...names(interaction.roles, (role) => `@${role.name}`)];

    await interaction.reply({ content: `You picked: ${picked.join(", ") || "nothing"}`, flags: MessageFlags.Ephemeral });
  },
};
