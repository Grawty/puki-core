const fs = require("fs");
const path = require("path");
const { log } = require("./utils/logger");

// Written every BEAT_MS while the gateway connection is up; Docker's HEALTHCHECK reads it.
const FILE = path.join(__dirname, "..", "data", "heartbeat");
const BEAT_MS = 30_000;
const STALE_MS = 90_000;

let warned = false;

/**
 * Writes the current time when the bot is connected, nothing when it is not. A frozen process or a
 * gateway that keeps failing to reconnect stops the beats, and the file goes stale.
 */
function beat(client, file = FILE, now = Date.now()) {
  if (!client.isReady()) return false;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, String(now));
    return true;
  } catch (error) {
    if (!warned) log(`Could not write the heartbeat file, the Docker health check will fail: ${error.message}`, "warn");
    warned = true;
    return false;
  }
}

function start(client) {
  beat(client);
  setInterval(() => beat(client), BEAT_MS).unref();
}

/** True when the last beat is recent enough. */
function isHealthy(file = FILE, now = Date.now(), staleMs = STALE_MS) {
  try {
    const last = Number(fs.readFileSync(file, "utf8"));
    return Number.isFinite(last) && now - last < staleMs;
  } catch {
    return false;
  }
}

module.exports = { beat, start, isHealthy, FILE, STALE_MS };

// `node src/health.js` is the health check itself: exit code 0 healthy, 1 not
if (require.main === module) process.exit(isHealthy() ? 0 : 1);
