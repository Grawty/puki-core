const COLORS = { info: "\x1b[36m", done: "\x1b[32m", warn: "\x1b[33m", err: "\x1b[31m" };
const RESET = "\x1b[0m";

function log(message, level = "info") {
  const stamp = new Date().toISOString().slice(11, 19);
  const text = message instanceof Error ? message.stack : message;
  console.log(`${COLORS[level] || ""}[${stamp}] [${level}]${RESET} ${text}`);
}

module.exports = { log };
