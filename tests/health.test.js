const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const health = require("../src/health");

const tempFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "puki-health-")), "data", "heartbeat");
const client = (ready) => ({ isReady: () => ready });

test("a connected bot beats, a disconnected one does not", () => {
  const file = tempFile();
  assert.strictEqual(health.beat(client(false), file), false);
  assert.ok(!fs.existsSync(file));

  assert.strictEqual(health.beat(client(true), file, 1_000_000), true);
  assert.strictEqual(fs.readFileSync(file, "utf8"), "1000000");
});

test("healthy only while the last beat is recent", () => {
  const file = tempFile();
  assert.strictEqual(health.isHealthy(file), false, "no beat yet");

  health.beat(client(true), file, 1_000_000);
  assert.strictEqual(health.isHealthy(file, 1_000_000 + health.STALE_MS - 1), true);
  assert.strictEqual(health.isHealthy(file, 1_000_000 + health.STALE_MS), false);

  fs.writeFileSync(file, "garbage");
  assert.strictEqual(health.isHealthy(file), false);
});

test("node src/health.js exits 1 without a fresh heartbeat", () => {
  // the shipped check reads data/heartbeat; in a fresh checkout it is missing or old
  if (health.isHealthy()) return;
  const { status } = spawnSync(process.execPath, [path.join(__dirname, "..", "src", "health.js")]);
  assert.strictEqual(status, 1);
});
