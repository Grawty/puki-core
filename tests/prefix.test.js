const test = require("node:test");
const assert = require("node:assert");
const { Collection } = require("discord.js");
const config = require("../src/config");
const { prefixProblem, prefixFor } = require("../src/guildSettings");
const messageCreate = require("../src/events/messageCreate");
const loadCommands = require("../src/handlers/commands");
const prefixCommand = require("../src/commands/slash/Settings/prefix");

config.prefix = "!";
const { stripPrefix } = messageCreate;

test("a prefix is 1 to 5 characters without spaces or backticks", () => {
  assert.strictEqual(prefixProblem("?"), null);
  assert.strictEqual(prefixProblem("puki!"), null);
  assert.ok(prefixProblem(""));
  assert.ok(prefixProblem("toolong"));
  assert.ok(prefixProblem("a b"));
  assert.ok(prefixProblem("`"));
});

test("servers without a custom prefix use the default one", () => {
  assert.strictEqual(prefixFor("some-guild"), "!");
  assert.strictEqual(prefixFor(undefined), "!");
});

test("stripPrefix understands the prefix and a mention of the bot", () => {
  assert.strictEqual(stripPrefix("!ping now", "!", "42"), "ping now");
  assert.strictEqual(stripPrefix("?ping", "?", "42"), "ping");
  assert.strictEqual(stripPrefix("<@42> ping", "?", "42"), "ping");
  assert.strictEqual(stripPrefix("<@!42>ping", "?", "42"), "ping");
  assert.strictEqual(stripPrefix("<@42>", "?", "42"), "");
  assert.strictEqual(stripPrefix("hello", "!", "42"), null);
  assert.strictEqual(stripPrefix("<@43> ping", "!", "42"), null);
});

function fakeClient() {
  const client = { user: { id: "42" }, interactions: new Collection(), prefixCommands: new Collection(), aliases: new Collection(), apiCommands: [] };
  loadCommands(client);
  return client;
}

const textOf = (payload) => (typeof payload === "string" ? payload : payload.content || payload.embeds?.[0]?.data?.description || "");

function fakeMessage(content, id) {
  const replies = [];
  return { replies, content, author: { id, bot: false }, guild: null, reply: async (payload) => { replies.push(textOf(payload)); } };
}

test("mentioning the bot runs a command, a bare mention shows the prefix", async () => {
  const client = fakeClient();

  const command = fakeMessage("<@42> say hello", "mention-user-1");
  await messageCreate.run(client, command);
  assert.deepStrictEqual(command.replies, ["hello"]);

  const bare = fakeMessage("<@42>", "mention-user-2");
  await messageCreate.run(client, bare);
  assert.match(bare.replies[0], /My prefix here is `!`/);
});

function prefixInteraction(sub, { allowed, value }) {
  const calls = [];
  return {
    calls,
    guild: { id: "g1" },
    isRepliable: () => true,
    deferred: false,
    replied: false,
    memberPermissions: { has: () => allowed },
    options: { getSubcommand: () => sub, getString: () => value },
    reply: async (payload) => { calls.push(textOf(payload)); },
  };
}

test("/prefix show works for everyone, changing it needs Manage Server", async () => {
  const show = prefixInteraction("show", { allowed: false });
  await prefixCommand.run({}, show);
  assert.match(show.calls[0], /The prefix here is `!`/);

  const set = prefixInteraction("set", { allowed: false, value: "?" });
  await prefixCommand.run({}, set);
  assert.match(set.calls[0], /Manage Server/);

  const reset = prefixInteraction("reset", { allowed: false });
  await prefixCommand.run({}, reset);
  assert.match(reset.calls[0], /Manage Server/);
});

test("/prefix set refuses a bad prefix before touching the database", async () => {
  const set = prefixInteraction("set", { allowed: true, value: "a b" });
  await prefixCommand.run({}, set);
  assert.match(set.calls[0], /spaces/);
});
