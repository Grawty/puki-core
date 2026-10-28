const fs = require("fs");
const path = require("path");
const { sequelize } = require("../database");
const { log } = require("../utils/logger");

// 001-add-something.js, 002-...: applied once each, in order
const MIGRATION_FILE = /^\d{3}-[\w-]+\.js$/;

/** The migration files that have not been applied yet, oldest first. */
function pending(files, applied) {
  return files.filter((file) => MIGRATION_FILE.test(file) && !applied.includes(file)).sort();
}

/**
 * sequelize.sync() creates missing tables but never changes existing ones. Changes to a table
 * that already exists go into a numbered file here, written so that running it twice is harmless
 * (IF NOT EXISTS and friends). Each file runs in its own transaction.
 */
async function runMigrations() {
  await sequelize.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now())');
  const [rows] = await sequelize.query("SELECT name FROM schema_migrations");

  for (const file of pending(fs.readdirSync(__dirname), rows.map((row) => row.name))) {
    await sequelize.transaction(async (transaction) => {
      await require(path.join(__dirname, file)).up({ sequelize, transaction });
      await sequelize.query("INSERT INTO schema_migrations (name) VALUES (:file)", { replacements: { file }, transaction });
    });
    log(`Applied migration ${file}`, "done");
  }
}

module.exports = { runMigrations, pending };
