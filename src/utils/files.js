const fs = require("fs");
const path = require("path");
const { log } = require("./logger");

/** Every .js file under a folder, depth first. A missing folder is an empty list. */
function jsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

/**
 * require() that survives a broken file: a syntax error or a failing import in one command
 * is logged and skipped instead of stopping the whole bot from starting.
 */
function safeRequire(file) {
  try {
    return require(file);
  } catch (error) {
    log(`Could not load ${path.basename(file)}: ${error.message}`, "err");
    return null;
  }
}

module.exports = { jsFiles, safeRequire };
