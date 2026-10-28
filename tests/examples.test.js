const test = require("node:test");
const assert = require("node:assert");
const { ComponentType } = require("discord.js");
const { pending } = require("../src/migrations");
const { buildModal: feedbackModal } = require("../src/commands/slash/Examples/feedback");
const { buildModal: reportModal } = require("../src/commands/slash/Examples/report");
const { buildRows } = require("../src/commands/slash/Examples/selects");
const { buildAbout } = require("../src/commands/slash/Examples/about");

// toJSON() runs discord.js' validation, so a bad builder call fails here instead of in a server

const fakeClient = {
  user: { displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png" },
  guilds: { cache: { size: 2 } },
  interactions: { size: 12 },
};

test("the feedback modal is valid and has at most five top level pieces", () => {
  const modal = feedbackModal().toJSON();
  assert.ok(modal.components.length <= 5);
  const inner = modal.components.filter((c) => c.type === ComponentType.Label).map((c) => c.component.type);
  assert.deepStrictEqual(inner, [ComponentType.TextInput, ComponentType.RadioGroup, ComponentType.CheckboxGroup, ComponentType.Checkbox]);
});

test("the report modal is valid and uses the pickers", () => {
  const modal = reportModal().toJSON();
  const inner = modal.components.map((c) => c.component.type);
  assert.deepStrictEqual(inner, [ComponentType.UserSelect, ComponentType.StringSelect, ComponentType.TextInput, ComponentType.FileUpload]);
});

test("the select demo has five menus, all handled by the demo component", () => {
  const rows = buildRows().map((row) => row.toJSON());
  assert.strictEqual(rows.length, 5);
  for (const row of rows) assert.ok(row.components[0].custom_id.startsWith("demo:"));
});

test("the about card is a valid Components V2 container", () => {
  const json = buildAbout(fakeClient).toJSON();
  assert.strictEqual(json.type, ComponentType.Container);
  assert.ok(json.components.length >= 3);
});

test("migrations: only numbered files that were not applied, oldest first", () => {
  const files = ["index.js", "002-b.js", "001-a.js", "notes.md", "003-c.js"];
  assert.deepStrictEqual(pending(files, ["001-a.js"]), ["002-b.js", "003-c.js"]);
  assert.deepStrictEqual(pending(files, ["001-a.js", "002-b.js", "003-c.js"]), []);
});
