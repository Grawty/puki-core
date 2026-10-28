const { SlashCommandBuilder } = require("discord.js");
const { claimDaily } = require("../../../economy");
const replies = require("../../../utils/replies");

const HOUR_MS = 60 * 60 * 1000;

module.exports = {
  structure: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily coins"),
  run: async (client, interaction) => {
    const result = await claimDaily(interaction.user.id);

    if (!result.ok) {
      const hours = Math.ceil(result.wait / HOUR_MS);
      return replies.warn(interaction, `You already claimed today. Come back in about ${hours}h.`);
    }
    await replies.success(interaction, `+${result.reward} coins. You now have ${result.coins.toLocaleString("en")}.`, { ephemeral: false });
  },
};
