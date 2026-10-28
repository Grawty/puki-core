const { log } = require("../utils/logger");

module.exports = {
  event: "clientReady",
  once: true,
  run: (_client, readyClient) => {
    log(`Logged in as ${readyClient.user.tag}`, "done");
  },
};
