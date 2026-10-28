const path = require("path");
const { jsFiles, safeRequire } = require("../utils/files");
const { log } = require("../utils/logger");

/** src/events/*.js, each exporting { event, once?, run(client, ...args) } */
module.exports = (client) => {
  for (const file of jsFiles(path.join(__dirname, "..", "events"))) {
    const handler = safeRequire(file);
    if (!handler) continue;
    if (!handler.event || typeof handler.run !== "function") {
      log(`Skipped event ${path.basename(file)}: it needs event and run().`, "warn");
      continue;
    }
    const listener = (...args) => {
      Promise.resolve(handler.run(client, ...args)).catch((error) => log(error, "err"));
    };
    if (handler.once) client.once(handler.event, listener);
    else client.on(handler.event, listener);
  }
};
