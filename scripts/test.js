const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// `node --test tests/*.test.js` only works with a shell that expands the pattern, and
// Node 20 does not expand it itself. Listing the files here behaves the same everywhere.
const dir = path.join(__dirname, "..", "tests");
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".test.js")).sort().map((name) => path.join(dir, name));

const { status } = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
process.exit(status ?? 1);
