const test = require("node:test");
const assert = require("node:assert");
const { Collection } = require("discord.js");
const loadCommands = require("../src/handlers/commands");
const loadComponents = require("../src/handlers/components");
const { dailyWait, DAILY_COINS } = require("../src/economy");

const fakeClient = () => ({
  interactions: new Collection(),
  prefixCommands: new Collection(),
  aliases: new Collection(),
  apiCommands: [],
  components: {
    buttons: new Collection(),
    selects: new Collection(),
    modals: new Collection(),
    autocomplete: new Collection(),
  },
});

test("every command file loads and serialises for Discord", () => {
  const client = fakeClient();
  loadCommands(client);

  assert.ok(client.interactions.size > 0);
  assert.strictEqual(client.apiCommands.length, client.interactions.size, "no two commands share a name");

  for (const command of client.apiCommands) {
    const json = command.toJSON();
    assert.ok(json.name.length >= 1 && json.name.length <= 32, `bad name: ${json.name}`);
    if (!json.type || json.type === 1) assert.ok(json.description, `/${json.name} needs a description`);
  }
});

test("text command aliases point at real commands", () => {
  const client = fakeClient();
  loadCommands(client);
  for (const target of client.aliases.values()) assert.ok(client.prefixCommands.has(target));
});

test("the ping button is registered by its customId", () => {
  const client = fakeClient();
  loadComponents(client);
  assert.ok(client.components.buttons.has("ping"));
});

test("the daily reward can be claimed once per 24 hours", () => {
  const now = Date.now();
  assert.strictEqual(dailyWait(null, now), 0);
  assert.strictEqual(dailyWait(new Date(now - 25 * 3600_000), now), 0);
  assert.strictEqual(dailyWait(new Date(now - 3600_000), now), 23 * 3600_000);
  assert.ok(DAILY_COINS > 0);
});
