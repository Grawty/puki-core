const scheduler = require("../scheduler");
const { log } = require("../utils/logger");

module.exports = {
  event: "clientReady",
  once: true,
  run: (client, readyClient) => {
    log(`Logged in as ${readyClient.user.tag}`, "done");
    scheduler.start(client);
  },
};
