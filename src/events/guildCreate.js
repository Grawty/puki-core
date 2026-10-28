const { log } = require("../utils/logger");

module.exports = {
  event: "guildCreate",
  run: (_client, guild) => {
    log(`Joined ${guild.name} (${guild.memberCount} members)`, "info");
  },
};
