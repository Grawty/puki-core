const test = require("node:test");
const assert = require("node:assert");
const cooldowns = require("../src/utils/cooldowns");

test("a second use inside the window reports what is left", () => {
  const now = 1_000_000;
  assert.strictEqual(cooldowns.hit("u1", "ping", 5000, now), 0);
  assert.strictEqual(cooldowns.hit("u1", "ping", 5000, now + 2000), 3000);
  assert.strictEqual(cooldowns.hit("u1", "ping", 5000, now + 5000), 0);
});

test("cooldowns are per user and per command", () => {
  const now = 2_000_000;
  cooldowns.hit("a", "ping", 5000, now);
  assert.strictEqual(cooldowns.hit("b", "ping", 5000, now), 0);
  assert.strictEqual(cooldowns.hit("a", "daily", 5000, now), 0);
});

test("no cooldown means no wait", () => {
  assert.strictEqual(cooldowns.hit("c", "x", 0), 0);
  assert.strictEqual(cooldowns.hit("c", "x", undefined), 0);
});

test("clear gives the wait back, sweep drops finished entries", () => {
  const now = 3_000_000;
  cooldowns.hit("d", "kick", 5000, now);
  cooldowns.clear("d", "kick");
  assert.strictEqual(cooldowns.hit("d", "kick", 5000, now + 1), 0);

  const before = cooldowns.size();
  cooldowns.sweep(now + 60_000);
  assert.ok(cooldowns.size() < before);
});
