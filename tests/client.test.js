const test = require("node:test");
const assert = require("node:assert");
const BotClient = require("../src/client");

test("the client builds without logging in and carries the configured status", () => {
  const client = new BotClient();
  const [activity] = client.options.presence.activities;
  assert.strictEqual(client.options.presence.status, "online");
  assert.ok(activity.name.length > 0);
  client.destroy();
});
