const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exportTables, oldFolders, folderName } = require("../src/backup");

// a stand-in for a Sequelize model with n rows, handed out in pages like findAll does
function fakeModel(table, count) {
  const all = Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `row ${i + 1}`, at: new Date(0) }));
  return {
    primaryKeyAttributes: ["id"],
    getTableName: () => table,
    findAll: async ({ limit, offset }) => all.slice(offset, offset + limit),
  };
}

test("every table becomes a .jsonl file with one row per line, across several pages", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-"));
  try {
    const { target, tables, rows } = await exportTables([fakeModel("users", 12_001), fakeModel("empty", 0)], dir, new Date("2026-10-28T09:30:00Z"));
    assert.strictEqual(path.basename(target), "2026-10-28T09-30-00Z");
    assert.strictEqual(tables, 2);
    assert.strictEqual(rows, 12_001);

    const lines = fs.readFileSync(path.join(target, "users.jsonl"), "utf8").trim().split("\n");
    assert.strictEqual(lines.length, 12_001);
    assert.deepStrictEqual(JSON.parse(lines[0]), { id: 1, name: "row 1", at: "1970-01-01T00:00:00.000Z" });
    assert.strictEqual(fs.readFileSync(path.join(target, "empty.jsonl"), "utf8"), "");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("only the newest folders are kept", () => {
  const names = ["2026-10-01T00-00-00Z", "2026-10-03T00-00-00Z", "2026-10-02T00-00-00Z", "2026-10-04T00-00-00Z"];
  assert.deepStrictEqual(oldFolders(names, 2), ["2026-10-02T00-00-00Z", "2026-10-01T00-00-00Z"]);
  assert.deepStrictEqual(oldFolders(names, 10), []);
  assert.strictEqual(oldFolders(names, 0).length, 3, "keep at least one");
});

test("folder names sort by date", () => {
  assert.ok(folderName(new Date("2026-01-02T00:00:00Z")) > folderName(new Date("2026-01-01T23:59:59Z")));
});
