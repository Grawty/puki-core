const BotClient = require("./client");
const { sequelize } = require("./database");
const { log } = require("./utils/logger");

const client = new BotClient();
client.start();

process.on("unhandledRejection", (reason) => log(reason, "err"));

// State after an uncaught exception is unknown: log it and let a supervisor (pm2, systemd, docker) restart us
process.on("uncaughtException", (error) => {
  log(error, "err");
  process.exit(1);
});

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  log(`${signal} received, shutting down.`, "info");

  setTimeout(() => process.exit(1), 10_000).unref();
  await client.destroy();
  await sequelize.close().catch(() => {});
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => shutdown(signal));
