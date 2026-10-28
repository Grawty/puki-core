const { SlashCommandBuilder, MessageFlags, time, TimestampStyles } = require("discord.js");
const { Reminder } = require("../../../models");
const { parseDuration, formatDuration } = require("../../../utils/duration");
const replies = require("../../../utils/replies");

const MIN_MS = 10_000;
const MAX_MS = 365 * 86_400_000;
const MAX_PER_USER = 25;

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Get a message back later")
    .addSubcommand((sub) => sub
      .setName("add")
      .setDescription("Set a reminder")
      .addStringOption((o) => o.setName("in").setDescription("When, like 10m, 2h30m or 1d").setRequired(true))
      .addStringOption((o) => o.setName("text").setDescription("What to remind you of").setMaxLength(500).setRequired(true)))
    .addSubcommand((sub) => sub.setName("list").setDescription("Your pending reminders"))
    .addSubcommand((sub) => sub
      .setName("cancel")
      .setDescription("Delete a reminder")
      .addIntegerOption((o) => o.setName("id").setDescription("The number shown by /remind list").setMinValue(1).setRequired(true))),
  options: { cooldown: 3 },
  run: async (client, interaction) => {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === "list") {
      const rows = await Reminder.findAll({ where: { userId }, order: [["dueAt", "ASC"]], limit: MAX_PER_USER });
      if (!rows.length) return replies.info(interaction, "You have no reminders.");
      const lines = rows.map((row) => `**${row.id}** · ${time(row.dueAt, TimestampStyles.RelativeTime)} · ${row.text}`);
      return interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
    }

    if (sub === "cancel") {
      const removed = await Reminder.destroy({ where: { id: interaction.options.getInteger("id"), userId } });
      return removed ? replies.success(interaction, "Reminder deleted.") : replies.fail(interaction, "You have no reminder with that number.");
    }

    const wait = parseDuration(interaction.options.getString("in"));
    if (wait === null) return replies.fail(interaction, "I could not read that time. Try something like 10m, 2h30m or 1d.");
    if (wait < MIN_MS || wait > MAX_MS) return replies.fail(interaction, "Pick a time between 10 seconds and 365 days.");
    if ((await Reminder.count({ where: { userId } })) >= MAX_PER_USER) {
      return replies.fail(interaction, `You can have ${MAX_PER_USER} reminders at most. Delete one first.`);
    }

    const dueAt = new Date(Date.now() + wait);
    const reminder = await Reminder.create({ userId, channelId: interaction.channelId, text: interaction.options.getString("text"), dueAt });
    await replies.success(interaction, `Done, reminder ${reminder.id} is set for ${time(dueAt, TimestampStyles.RelativeTime)} (in ${formatDuration(wait)}).`, { ephemeral: false });
  },
};
