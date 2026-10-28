const test = require("node:test");
const assert = require("node:assert");
const { parseDuration, formatDuration } = require("../src/utils/duration");
const { deliver } = require("../src/scheduler");

test("durations are read from number and unit pieces", () => {
  assert.strictEqual(parseDuration("90s"), 90_000);
  assert.strictEqual(parseDuration("2h30m"), 9_000_000);
  assert.strictEqual(parseDuration("1d 12h"), 129_600_000);
  assert.strictEqual(parseDuration("1W"), 604_800_000);
});

test("anything that is not number plus unit is refused", () => {
  for (const text of ["", "soon", "10", "m5", "5x", "-5m", "1.5h", "5m later"]) assert.strictEqual(parseDuration(text), null, text);
});

test("durations are shown the short way", () => {
  assert.strictEqual(formatDuration(93_784_000), "1d 2h 3m 4s");
  assert.strictEqual(formatDuration(60_000), "1m");
  assert.strictEqual(formatDuration(0), "0s");
});

function fakeClient({ channelFails = false, dmFails = false } = {}) {
  const posts = [];
  return {
    posts,
    rest: {
      post: async (route, { body }) => {
        posts.push({ route, body });
        if (route.endsWith("/messages") && channelFails && route.includes("/channels/c1/")) throw new Error("Missing Access");
        if (route === "/users/@me/channels") {
          if (dmFails) throw new Error("Cannot send DMs");
          return { id: "dm1" };
        }
        if (dmFails && route.includes("/channels/dm1/")) throw new Error("Cannot send DMs");
        return {};
      },
    },
  };
}

const reminder = { id: 1, userId: "u1", channelId: "c1", text: "stretch @everyone" };

test("a reminder goes to its channel and only pings its owner", async () => {
  const client = fakeClient();
  assert.strictEqual(await deliver(client, reminder), "channel");
  assert.strictEqual(client.posts[0].route, "/channels/c1/messages");
  assert.deepStrictEqual(client.posts[0].body.allowed_mentions, { users: ["u1"] });
});

test("when the channel is not reachable the reminder arrives by DM", async () => {
  const client = fakeClient({ channelFails: true });
  assert.strictEqual(await deliver(client, reminder), "dm");
  assert.strictEqual(client.posts.at(-1).route, "/channels/dm1/messages");
});

test("when nothing is reachable it gives up without throwing", async () => {
  const client = fakeClient({ channelFails: true, dmFails: true });
  assert.strictEqual(await deliver(client, reminder), null);
});

const remind = require("../src/commands/slash/Tools/remind");

function remindInteraction(when) {
  const calls = [];
  return {
    calls,
    user: { id: "u1" },
    isRepliable: () => true,
    deferred: false,
    replied: false,
    options: { getSubcommand: () => "add", getString: (name) => (name === "in" ? when : "text") },
    reply: async (payload) => { calls.push(payload.embeds?.[0]?.data?.description || payload.content); },
  };
}

test("/remind refuses a time it cannot read or that is out of range, before touching the database", async () => {
  for (const [when, expected] of [["soon", /could not read/], ["5s", /between 10 seconds/], ["400d", /between 10 seconds/]]) {
    const interaction = remindInteraction(when);
    await remind.run({}, interaction);
    assert.match(interaction.calls[0], expected, when);
  }
});
