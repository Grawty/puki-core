const { Sequelize } = require("sequelize");
const pg = require("pg");
const config = require("./config");
const { log } = require("./utils/logger");

// BIGINT arrives from pg as a string, which turns `coins + 5` into concatenation
pg.types.setTypeParser(20, (value) => parseInt(value, 10));

const { host, port, name, user, password } = config.db;

const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: "postgres",
  logging: false,
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    require("./models");
    // sync() only creates missing tables; changes to existing ones are migrations (src/migrations)
    await sequelize.sync();
    await require("./migrations").runMigrations();
    log("Database connected.", "done");
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, "err");
    return false;
  }
}

module.exports = { sequelize, connectDatabase };
