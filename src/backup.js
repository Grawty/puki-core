const fs = require("fs");
const path = require("path");
const config = require("./config");
const { sequelize } = require("./database");
const { log } = require("./utils/logger");

const PAGE = 5000;
const CHECK_EVERY_MS = 60 * 60 * 1000;

// folder names are timestamps (2026-10-28T09-30-00Z), so sorting the names sorts by age
const folderName = (date = new Date()) => date.toISOString().replace(/\.\d+Z$/, "Z").replace(/:/g, "-");

/** The folders to delete so that only the newest `keep` remain. */
function oldFolders(names, keep) {
  return [...names].sort().reverse().slice(Math.max(keep, 1));
}

/**
 * Writes every table to <dir>/<timestamp>/<table>.jsonl, one row per line, read in pages so a big
 * table never has to fit in memory. This is a safety net, not a replacement for pg_dump: for a large
 * database, schedule pg_dump on the server as well.
 */
async function exportTables(models, dir, date = new Date()) {
  const target = path.join(dir, folderName(date));
  fs.mkdirSync(target, { recursive: true });

  let rows = 0;
  for (const model of models) {
    const file = path.join(target, `${model.getTableName()}.jsonl`);
    fs.writeFileSync(file, "");
    for (let offset = 0; ; offset += PAGE) {
      const page = await model.findAll({ raw: true, limit: PAGE, offset, order: model.primaryKeyAttributes.map((key) => [key, "ASC"]) });
      if (!page.length) break;
      fs.appendFileSync(file, page.map((row) => JSON.stringify(row)).join("\n") + "\n");
      rows += page.length;
    }
  }
  return { target, tables: models.length, rows };
}

/** Takes a backup of every model and removes the oldest ones beyond BACKUP_KEEP. */
async function runBackup({ dir = config.backup.dir, keep = config.backup.keep } = {}) {
  const result = await exportTables(Object.values(sequelize.models), dir);
  for (const name of oldFolders(fs.readdirSync(dir), keep)) fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  return result;
}

const newestAgeMs = (dir) => {
  if (!fs.existsSync(dir)) return Infinity;
  const names = fs.readdirSync(dir).sort();
  return names.length ? Date.now() - fs.statSync(path.join(dir, names.at(-1))).mtimeMs : Infinity;
};

/**
 * Backs up when the newest backup is older than BACKUP_EVERY_HOURS, checked now and then every hour,
 * so a restart does not skip a day and does not make an extra copy either. 0 turns it off.
 */
function start() {
  const { dir, everyHours } = config.backup;
  if (everyHours <= 0) return;

  const check = async () => {
    if (newestAgeMs(dir) < everyHours * 3_600_000) return;
    try {
      const { target, tables, rows } = await runBackup();
      log(`Backup written to ${target} (${tables} tables, ${rows} rows)`, "done");
    } catch (error) {
      log(`Backup failed: ${error.message}`, "err");
    }
  };
  check();
  setInterval(check, CHECK_EVERY_MS).unref();
}

module.exports = { exportTables, runBackup, oldFolders, folderName, start };
