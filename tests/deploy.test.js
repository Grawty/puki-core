const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { REST } = require("discord.js");
const config = require("../src/config");
const deploy = require("../src/handlers/deploy");

const client = { apiCommands: [{ name: "ping", description: "Pong" }] };

// stands in for Discord: counts the PUTs, or fails like Discord would
function fakeDiscord(t, { fail = false } = {}) {
  const calls = [];
  t.mock.method(REST.prototype, "put", async (route, options) => {
    calls.push({ route, options });
    if (fail) throw new Error("401: Unauthorized");
  });
  return calls;
}

function captureLogs(t) {
  const lines = [];
  t.mock.method(console, "log", (line) => lines.push(line));
  return lines;
}

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "puki-deploy-"));

test.beforeEach(() => {
  config.token = "test-token";
  config.clientId = "123";
  config.devGuildId = null;
});

test("the first start sends the commands and remembers them, the next one sends nothing", async (t) => {
  const calls = fakeDiscord(t);
  captureLogs(t);
  const file = path.join(tempDir(), "data", "deploy-cache.json");

  await deploy(client, file);
  assert.strictEqual(calls.length, 1);
  assert.ok(fs.existsSync(file), "the folder is created when it is missing");

  await deploy(client, file);
  assert.strictEqual(calls.length, 1, "unchanged commands are not sent again");
});

test("a cache that cannot be written is a warning, not a failed registration", async (t) => {
  const calls = fakeDiscord(t);
  const logs = captureLogs(t);
  // a file where the folder should be: mkdir fails the way a read-only folder would
  const blocker = path.join(tempDir(), "data");
  fs.writeFileSync(blocker, "");

  await deploy(client, path.join(blocker, "deploy-cache.json"));

  assert.strictEqual(calls.length, 1);
  assert.ok(logs.some((line) => line.includes("Registered 1 commands")));
  assert.ok(logs.some((line) => line.includes("[warn]") && line.includes("sent again on the next start")));
  assert.ok(!logs.some((line) => line.includes("Could not register")));
});

test("when Discord refuses, nothing is remembered and the next start tries again", async (t) => {
  captureLogs(t);
  const file = path.join(tempDir(), "deploy-cache.json");

  fakeDiscord(t, { fail: true });
  await deploy(client, file);
  assert.ok(!fs.existsSync(file));

  t.mock.restoreAll();
  captureLogs(t);
  const calls = fakeDiscord(t);
  await deploy(client, file);
  assert.strictEqual(calls.length, 1);
});
