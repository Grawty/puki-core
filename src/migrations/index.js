const fs = require("fs");
const path = require("path");
const { sequelize } = require("../database");
const { log } = require("../utils/logger");

// 001-add-something.js, 002-...: applied once each, in order
const MIGRATION_FILE = /^\d{3}-[\w-]+\.js$/;

// any number, as long as it is the same for every process that migrates this database
const LOCK_KEY = 727_001;

/** The migration files that have not been applied yet, oldest first. */
function pending(files, applied) {
  return files.filter((file) => MIGRATION_FILE.test(file) && !applied.includes(file)).sort();
}

/**
 * sequelize.sync() creates missing tables but never changes existing ones. Changes to a table
 * that already exists go into a numbered file here, written so that running it twice is harmless
 * (IF NOT EXISTS and friends).
 *
 * All pending files run in one transaction: if one fails, none of them is applied. The advisory
 * lock makes a second process (another shard, a second container) wait instead of running
 * the same files at the same time.
 */
async function runMigrations() {
  await sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(:key)", { replacements: { key: LOCK_KEY }, transaction });
    await sequelize.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now())',
      { transaction },
    );
    const [rows] = await sequelize.query("SELECT name FROM schema_migrations", { transaction });

    for (const file of pending(fs.readdirSync(__dirname), rows.map((row) => row.name))) {
      await require(path.join(__dirname, file)).up({ sequelize, transaction });
      await sequelize.query("INSERT INTO schema_migrations (name) VALUES (:file)", { replacements: { file }, transaction });
      log(`Applied migration ${file}`, "done");
    }
  });
}

module.exports = { runMigrations, pending };
