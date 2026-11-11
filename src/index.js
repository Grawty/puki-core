const BotClient = require("./client");
const { sequelize } = require("./database");
const { log } = require("./utils/logger");

const client = new BotClient();

// A bot that cannot log in (wrong token, an intent not enabled in the portal) must exit with an
// error code, or pm2 and systemd's Restart=on-failure would take it for a clean stop
client.start().catch((error) => {
  log(error, "err");
  if (/disallowed intents/i.test(error.message)) {
    log("Enable the Message Content intent in the developer portal (Bot page), or remove it from src/client.js.", "err");
  }
  process.exit(1);
});

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
