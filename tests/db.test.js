const test = require("node:test");
const assert = require("node:assert");

// Needs a real PostgreSQL database that may be wiped: createdb puki_core_test
//   TEST_DB_NAME=puki_core_test npm test
// Without it these are skipped, and nothing in the test run ever connects to the bot's own database.
const skip = process.env.TEST_DB_NAME ? false : "set TEST_DB_NAME to run the database tests";

const { sequelize, connectDatabase } = require("../src/database");
const { User, Guild, Reminder } = require("../src/models");
const { claimDaily, DAILY_COINS } = require("../src/economy");
const { runMigrations } = require("../src/migrations");
const guildSettings = require("../src/guildSettings");
const scheduler = require("../src/scheduler");
const backup = require("../src/backup");
const fs = require("fs");
const os = require("os");
const path = require("path");

test.before(async () => {
  if (skip) return;
  assert.ok(await connectDatabase(), "could not connect to TEST_DB_NAME");
});

test.after(async () => {
  if (skip) return;
  await User.destroy({ where: { id: ["db_a", "db_b", "db_rollback"] } });
  await Guild.destroy({ where: { id: "db_guild" } });
  await Reminder.destroy({ where: { userId: "db_user" } });
  await sequelize.close();
});

test("parallel daily claims pay exactly once", { skip }, async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => claimDaily("db_a")));
  assert.strictEqual(results.filter((r) => r.ok).length, 1);
  assert.strictEqual((await User.findByPk("db_a")).coins, DAILY_COINS);
});

test("a second claim reports how long to wait", { skip }, async () => {
  await claimDaily("db_b");
  const again = await claimDaily("db_b");
  assert.strictEqual(again.ok, false);
  assert.ok(again.wait > 0);
});

test("a transaction that throws leaves nothing behind", { skip }, async () => {
  await assert.rejects(sequelize.transaction(async (transaction) => {
    await User.create({ id: "db_rollback", coins: 999 }, { transaction });
    throw new Error("fail halfway");
  }), /fail halfway/);
  assert.strictEqual(await User.findByPk("db_rollback"), null);
});

test("migrations are recorded and running them again changes nothing", { skip }, async () => {
  await runMigrations();
  await runMigrations();
  const [rows] = await sequelize.query("SELECT name FROM schema_migrations WHERE name = '001-users-coins-index.js'");
  assert.strictEqual(rows.length, 1);
  const [index] = await sequelize.query("SELECT 1 FROM pg_indexes WHERE indexname = 'users_coins_idx'");
  assert.strictEqual(index.length, 1);
});

test("two processes migrating at once do not collide", { skip }, async () => {
  await assert.doesNotReject(Promise.all([runMigrations(), runMigrations(), runMigrations()]));
});

test("a saved prefix is used, survives a reload and can be reset", { skip }, async () => {
  await guildSettings.setPrefix("db_guild", "?");
  assert.strictEqual(guildSettings.prefixFor("db_guild"), "?");

  await guildSettings.loadPrefixes();
  assert.strictEqual(guildSettings.prefixFor("db_guild"), "?");

  await guildSettings.setPrefix("db_guild", null);
  await guildSettings.loadPrefixes();
  assert.notStrictEqual(guildSettings.prefixFor("db_guild"), "?");
});

test("a due reminder is claimed exactly once, a future one stays", { skip }, async () => {
  const past = new Date(Date.now() - 1000);
  const future = new Date(Date.now() + 3_600_000);
  await Reminder.create({ userId: "db_user", channelId: "c1", text: "due", dueAt: past });
  await Reminder.create({ userId: "db_user", channelId: "c1", text: "later", dueAt: future });

  const claims = await Promise.all(Array.from({ length: 5 }, () => scheduler.claimDue()));
  const mine = claims.flat().filter((row) => row.userId === "db_user");
  assert.deepStrictEqual(mine.map((row) => row.text), ["due"]);
  assert.strictEqual(await Reminder.count({ where: { userId: "db_user" } }), 1);
});

test("a backup of the real tables contains the rows that were saved", { skip }, async () => {
  await claimDaily("db_b").catch(() => {});
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-db-"));
  try {
    const { target } = await backup.runBackup({ dir, keep: 3 });
    const users = fs.readFileSync(path.join(target, "users.jsonl"), "utf8");
    assert.ok(users.split("\n").some((line) => line && JSON.parse(line).id === "db_b"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
