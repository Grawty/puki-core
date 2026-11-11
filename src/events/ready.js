const backup = require("../backup");
const health = require("../health");
const scheduler = require("../scheduler");
const { log } = require("../utils/logger");

module.exports = {
  event: "clientReady",
  once: true,
  run: (client, readyClient) => {
    log(`Logged in as ${readyClient.user.tag}`, "done");
    scheduler.start(client);
    health.start(client);
    // with sharding every shard gets this event, one backup is enough
    if (!client.shard || client.shard.ids.includes(0)) backup.start();
  },
};
