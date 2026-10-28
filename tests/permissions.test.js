const test = require("node:test");
const assert = require("node:assert");
const { PermissionFlagsBits } = require("discord.js");
const { moderationProblem } = require("../src/utils/permissions");

const NEED = PermissionFlagsBits.KickMembers;

const member = (id, position, allowed = true) => ({
  id,
  permissions: { has: () => allowed },
  roles: { highest: { position } },
});

const setup = ({ actor = member("actor", 5), me = member("bot", 10) } = {}) => ({
  guild: { ownerId: "owner" },
  member: actor,
  me,
});

test("a valid target passes", () => {
  assert.strictEqual(moderationProblem(setup(), member("target", 3), NEED), null);
});

test("the actor needs the permission, and so does the bot", () => {
  assert.match(moderationProblem(setup({ actor: member("actor", 5, false) }), member("t", 1), NEED), /You don't/);
  assert.match(moderationProblem(setup({ me: member("bot", 10, false) }), member("t", 1), NEED), /I don't/);
});

test("missing target, self, owner and the bot are refused", () => {
  assert.match(moderationProblem(setup(), null, NEED), /isn't in this server/);
  assert.match(moderationProblem(setup(), member("actor", 5), NEED), /yourself/);
  assert.match(moderationProblem(setup(), member("owner", 1), NEED), /owner/);
  assert.ok(moderationProblem(setup(), member("bot", 1), NEED));
});

test("role hierarchy is checked for the actor and for the bot", () => {
  assert.match(moderationProblem(setup(), member("t", 5), NEED), /yours/);
  assert.match(moderationProblem(setup({ actor: member("actor", 20) }), member("t", 10), NEED), /mine/);
});

test("the server owner may moderate people at or above their top role", () => {
  const context = setup({ actor: member("owner", 1) });
  assert.strictEqual(moderationProblem(context, member("t", 3), NEED), null);
});
