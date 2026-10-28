const { Client, Collection, GatewayIntentBits, Options } = require("discord.js");
const loadCommands = require("./handlers/commands");
const loadEvents = require("./handlers/events");
const loadComponents = require("./handlers/components");
const deploy = require("./handlers/deploy");
const config = require("./config");
const { connectDatabase } = require("./database");
const { log } = require("./utils/logger");

class BotClient extends Client {
  // slash commands and context menus, by name
  interactions = new Collection();
  prefixCommands = new Collection();
  aliases = new Collection();
  components = {
    buttons: new Collection(),
    selects: new Collection(),
    modals: new Collection(),
    autocomplete: new Collection(),
  };
  // what gets sent to Discord (builders or plain objects)
  apiCommands = [];

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // privileged: only needed for text commands
      ],
      makeCache: Options.cacheWithLimits({ ...Options.DefaultMakeCacheSettings, MessageManager: 50 }),
    });
  }

  async start() {
    if (!config.token || !config.clientId) {
      log("CLIENT_TOKEN and CLIENT_ID are required. Copy .env.example to .env and fill them in.", "err");
      process.exit(1);
    }

    loadCommands(this);
    loadEvents(this);
    loadComponents(this);

    if (!(await connectDatabase())) process.exit(1);

    await this.login(config.token);
    // with sharding every shard runs this file, but the commands only need to be sent once
    if (!this.shard || this.shard.ids.includes(0)) await deploy(this);
  }
}

module.exports = BotClient;
