const { Routes } = require("discord.js");
const { sequelize } = require("./database");
const { log } = require("./utils/logger");

const INTERVAL_MS = 15_000;
const BATCH = 50;

/**
 * Takes the reminders that are due out of the table and returns them.
 * DELETE ... RETURNING with SKIP LOCKED makes each reminder go to exactly one caller, even when
 * several shards or containers run this at the same moment. The price: if the process dies between
 * this call and the delivery, that reminder is lost rather than sent twice.
 */
async function claimDue(limit = BATCH) {
  const [rows] = await sequelize.query(
    `DELETE FROM reminders WHERE id IN (
       SELECT id FROM reminders WHERE "dueAt" <= now() ORDER BY "dueAt" LIMIT :limit FOR UPDATE SKIP LOCKED
     ) RETURNING *`,
    { replacements: { limit } },
  );
  return rows;
}

/**
 * Sends one reminder in its channel, or in a DM when the channel is gone or the bot cannot write there.
 * It goes through REST, not the gateway cache, so any shard can deliver any reminder.
 */
async function deliver(client, reminder) {
  const body = {
    content: `<@${reminder.userId}> reminder: ${reminder.text}`,
    allowed_mentions: { users: [reminder.userId] },
  };
  try {
    await client.rest.post(Routes.channelMessages(reminder.channelId), { body });
    return "channel";
  } catch {
    try {
      const dm = await client.rest.post(Routes.userChannels(), { body: { recipient_id: reminder.userId } });
      await client.rest.post(Routes.channelMessages(dm.id), { body });
      return "dm";
    } catch (error) {
      log(`Could not deliver reminder ${reminder.id}: ${error.message}`, "warn");
      return null;
    }
  }
}

let running = false;

/** One pass: claim what is due and deliver it. Returns how many reminders it handled. */
async function runOnce(client) {
  if (running) return 0; // a slow pass must not overlap the next tick
  running = true;
  try {
    const due = await claimDue();
    await Promise.all(due.map((reminder) => deliver(client, reminder)));
    return due.length;
  } finally {
    running = false;
  }
}

/** Checks for due reminders now and then every 15 seconds. A reminder that came due while the bot was off goes out on the first pass. */
function start(client) {
  const tick = () => runOnce(client).catch((error) => log(`Scheduler: ${error.message}`, "err"));
  tick();
  setInterval(tick, INTERVAL_MS).unref();
}

module.exports = { claimDue, deliver, runOnce, start };
