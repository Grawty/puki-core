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

test("every kind of component is registered", () => {
  const client = fakeClient();
  loadComponents(client);
  assert.ok(client.components.buttons.has("ping"));
  assert.ok(client.components.selects.has("demo"));
  assert.ok(client.components.modals.has("feedback") && client.components.modals.has("report"));
  assert.ok(client.components.autocomplete.has("options"));
});

test("every slash command that opens a component has a handler for it", () => {
  const client = fakeClient();
  loadCommands(client);
  for (const id of ["selects", "feedback", "report", "options"]) assert.ok(client.interactions.has(id), id);
});

test("the daily reward can be claimed once per 24 hours", () => {
  const now = Date.now();
  assert.strictEqual(dailyWait(null, now), 0);
  assert.strictEqual(dailyWait(new Date(now - 25 * 3600_000), now), 0);
  assert.strictEqual(dailyWait(new Date(now - 3600_000), now), 23 * 3600_000);
  assert.ok(DAILY_COINS > 0);
});
