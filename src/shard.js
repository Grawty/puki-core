const path = require("path");
const { ShardingManager } = require("discord.js");
const config = require("./config");
const { log } = require("./utils/logger");

// Needed once the bot is in about 2,500 servers. Each shard is a copy of src/index.js, so
// anything kept in memory (cooldowns, caches) is per shard.
const manager = new ShardingManager(path.join(__dirname, "index.js"), { token: config.token });

manager.on("shardCreate", (shard) => log(`Launched shard ${shard.id}`, "info"));
manager.spawn();
