const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Collection } = require("discord.js");
const config = require("../src/config");
const loadCommands = require("../src/handlers/commands");
const loadComponents = require("../src/handlers/components");
const { safeRequire } = require("../src/utils/files");
const interactionCreate = require("../src/events/interactionCreate");
const messageCreate = require("../src/events/messageCreate");

// These run the real event handlers and the real commands against fake Discord objects:
// the whole path from "something arrived" to "what the user was told".

config.prefix = "!";
config.owners.add("boss");

let counter = 0;
const nextUser = () => `user${++counter}`;

function makeClient() {
  const client = {
    interactions: new Collection(),
    prefixCommands: new Collection(),
    aliases: new Collection(),
    apiCommands: [],
    components: { buttons: new Collection(), selects: new Collection(), modals: new Collection(), autocomplete: new Collection() },
    ws: { ping: 42 },
    guilds: { cache: { size: 1 } },
  };
  loadCommands(client);
  loadComponents(client);
  return client;
}

const textOf = (payload) => (typeof payload === "string" ? payload : payload.content || payload.embeds?.[0]?.data?.description || "");

function fakeInteraction(extra = {}) {
  const calls = [];
  const record = (kind) => async (payload) => { calls.push({ kind, text: textOf(payload), payload }); };
  const interaction = {
    calls,
    user: { id: nextUser(), tag: "tester#0001" },
    guild: null,
    deferred: false,
    replied: false,
    commandName: "ping",
    isRepliable: () => true,
    isAutocomplete: () => false,
    isCommand: () => true,
    isButton: () => false,
    isAnySelectMenu: () => false,
    isModalSubmit: () => false,
    reply: record("reply"),
    followUp: record("followUp"),
    editReply: record("editReply"),
    update: record("update"),
    ...extra,
  };
  return interaction;
}

const say = (client, interaction) => interactionCreate.run(client, interaction);

test("a command that is not loaded gets a clear answer", async () => {
  const client = makeClient();
  const interaction = fakeInteraction({ commandName: "gone" });
  await say(client, interaction);
  assert.match(interaction.calls[0].text, /no longer available/);
});

test("an owner-only command refuses everyone but the owners", async () => {
  const client = makeClient();

  const stranger = fakeInteraction({ commandName: "status" });
  await say(client, stranger);
  assert.match(stranger.calls[0].text, /Only the bot owner/);

  const boss = fakeInteraction({ commandName: "status", user: { id: "boss", tag: "boss#1" } });
  await say(client, boss);
  assert.match(boss.calls[0].text, /Uptime/);
});

test("the cooldown applies to the same user and command, not to others", async () => {
  const client = makeClient();
  const first = fakeInteraction({ commandName: "ping" });
  await say(client, first);
  assert.match(first.calls[0].text, /Pong/);

  const again = fakeInteraction({ commandName: "ping", user: first.user });
  await say(client, again);
  assert.match(again.calls[0].text, /Slow down/);

  const other = fakeInteraction({ commandName: "ping" });
  await say(client, other);
  assert.match(other.calls[0].text, /Pong/);
});

test("a guild-only command refuses a DM", async () => {
  const client = makeClient();
  const interaction = fakeInteraction({ commandName: "server" });
  await say(client, interaction);
  assert.match(interaction.calls[0].text, /only works in a server/);
});

test("a command that throws still answers the user and does not reject", async () => {
  const client = makeClient();
  client.interactions.set("boom", { options: {}, run: async () => { throw new Error("broken on purpose"); } });
  const interaction = fakeInteraction({ commandName: "boom" });
  await assert.doesNotReject(say(client, interaction));
  assert.match(interaction.calls[0].text, /went wrong/);
});

test("a command that throws after replying gets a follow-up instead", async () => {
  const client = makeClient();
  client.interactions.set("late", { options: {}, run: async (c, i) => { i.replied = true; throw new Error("late"); } });
  const interaction = fakeInteraction({ commandName: "late" });
  await say(client, interaction);
  assert.strictEqual(interaction.calls[0].kind, "followUp");
});

test("components go through the same checks", async () => {
  const client = makeClient();
  let ran = 0;
  client.components.buttons.set("secret", { customId: "secret", options: { ownerOnly: true }, run: async () => { ran++; } });
  const button = (user) => fakeInteraction({ isCommand: () => false, isButton: () => true, customId: "secret:42", user });

  const stranger = button({ id: nextUser(), tag: "x#1" });
  await say(client, stranger);
  assert.strictEqual(ran, 0);
  assert.match(stranger.calls[0].text, /Only the bot owner/);

  await say(client, button({ id: "boss", tag: "boss#1" }));
  assert.strictEqual(ran, 1);
});

test("the ping button edits the message it sits on", async () => {
  const client = makeClient();
  const interaction = fakeInteraction({ isCommand: () => false, isButton: () => true, customId: "ping:refresh" });
  await say(client, interaction);
  assert.strictEqual(interaction.calls[0].kind, "update");
  assert.match(interaction.calls[0].text, /42ms/);
});

test("autocomplete answers, but not for an owner-only command", async () => {
  const client = makeClient();
  const answers = [];
  const autocomplete = (commandName, user) => fakeInteraction({
    isCommand: () => false,
    isAutocomplete: () => true,
    commandName,
    user,
    options: { getFocused: () => ({ name: "fruit", value: "ap" }) },
    respond: async (list) => { answers.push(list); },
  });

  await say(client, autocomplete("options", { id: nextUser() }));
  assert.deepStrictEqual(answers[0].map((a) => a.name), ["Apple", "Apricot", "Grape", "Pineapple"]);

  client.interactions.set("hidden", { options: { ownerOnly: true }, run: async () => {} });
  client.components.autocomplete.set("hidden", { commandName: "hidden", run: async (c, i) => i.respond([{ name: "secret", value: "s" }]) });
  await say(client, autocomplete("hidden", { id: nextUser() }));
  assert.deepStrictEqual(answers[1], []);
});

function fakeMessage(content, extra = {}) {
  const calls = [];
  return {
    calls,
    content,
    author: { id: nextUser(), bot: false },
    guild: null,
    reply: async (payload) => { calls.push(textOf(payload)); },
    ...extra,
  };
}

test("text commands: the prefix, arguments and aliases", async () => {
  const client = makeClient();

  const say1 = fakeMessage("!say hello   there");
  await messageCreate.run(client, say1);
  assert.deepStrictEqual(say1.calls, ["hello there"]);

  const alias = fakeMessage("!ECHO hi");
  await messageCreate.run(client, alias);
  assert.deepStrictEqual(alias.calls, ["hi"]);

  const empty = fakeMessage("!say");
  await messageCreate.run(client, empty);
  assert.deepStrictEqual(empty.calls, ["Say what?"]);
});

test("text commands ignore bots, other prefixes and unknown commands", async () => {
  const client = makeClient();
  for (const message of [
    fakeMessage("!say hi", { author: { id: "b", bot: true } }),
    fakeMessage("?say hi"),
    fakeMessage("!nothing"),
    fakeMessage("just chatting"),
  ]) {
    await messageCreate.run(client, message);
    assert.deepStrictEqual(message.calls, []);
  }
});

test("text commands have the same cooldown as slash commands", async () => {
  const client = makeClient();
  const author = { id: nextUser(), bot: false };
  const first = fakeMessage("!ping", { author });
  await messageCreate.run(client, first);
  assert.match(first.calls[0], /Pong/);

  const second = fakeMessage("!ping", { author });
  await messageCreate.run(client, second);
  assert.match(second.calls[0], /Slow down/);
});

test("a text command that throws answers instead of crashing", async () => {
  const client = makeClient();
  client.prefixCommands.set("crash", { options: {}, run: async () => { throw new Error("nope"); } });
  const message = fakeMessage("!crash");
  await assert.doesNotReject(messageCreate.run(client, message));
  assert.match(message.calls[0], /went wrong/);
});

const member = (id, position, extra = {}) => ({
  id,
  user: { tag: `${id}#0001` },
  permissions: { has: () => true },
  roles: { highest: { position } },
  ...extra,
});

function kickInteraction({ target, actor = member("mod", 5) }) {
  const kicked = [];
  const me = member("bot", 10);
  const interaction = fakeInteraction({
    commandName: "kick",
    guild: { ownerId: "owner", members: { me } },
    member: actor,
    user: { id: actor.id, tag: actor.user.tag },
    options: { getMember: () => target, getString: () => "spam" },
  });
  if (target) target.kick = async (reason) => { kicked.push(reason); };
  return { interaction, kicked };
}

test("/kick refuses a target above the moderator and kicks nobody", async () => {
  const client = makeClient();
  const { interaction, kicked } = kickInteraction({ target: member("victim", 8), actor: member("mod5", 5) });
  await say(client, interaction);
  assert.match(interaction.calls[0].text, /not below yours/);
  assert.deepStrictEqual(kicked, []);
});

test("/kick refuses the server owner and someone who left", async () => {
  const client = makeClient();
  const owner = kickInteraction({ target: member("owner", 1), actor: member("mod4", 5) });
  await say(client, owner.interaction);
  assert.match(owner.interaction.calls[0].text, /owner/);
  assert.deepStrictEqual(owner.kicked, []);

  const gone = kickInteraction({ target: null, actor: member("mod2", 5) });
  await say(client, gone.interaction);
  assert.match(gone.interaction.calls[0].text, /isn't in this server/);
});

test("/kick kicks a valid target with the reason in the audit log", async () => {
  const client = makeClient();
  const { interaction, kicked } = kickInteraction({ target: member("victim", 2), actor: member("mod3", 5) });
  await say(client, interaction);
  assert.deepStrictEqual(kicked, ["mod3#0001: spam"]);
  assert.match(interaction.calls[0].text, /Kicked victim#0001/);
});

test("a broken command file is skipped, not fatal", () => {
  const file = path.join(os.tmpdir(), `broken-${Date.now()}.js`);
  fs.writeFileSync(file, "module.exports = { structure: (");
  try {
    assert.strictEqual(safeRequire(file), null);
  } finally {
    fs.rmSync(file);
  }
});
