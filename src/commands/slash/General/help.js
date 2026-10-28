const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder().setName("help").setDescription("List what the bot can do"),
  options: { cooldown: 5 },
  run: async (client, interaction) => {
    const byCategory = new Map();
    for (const command of client.interactions.values()) {
      if (command.type !== "slash") continue;
      const list = byCategory.get(command.category) || [];
      list.push(`\`/${command.structure.name}\` ${command.structure.description}`);
      byCategory.set(command.category, list);
    }

    const embed = new EmbedBuilder().setColor(0x5865f2).setTitle("Commands");
    for (const [category, lines] of byCategory) embed.addFields({ name: category, value: lines.join("\n") });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
