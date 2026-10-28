const path = require("path");
const { jsFiles } = require("../utils/files");
const { log } = require("../utils/logger");

const ROOT = path.join(__dirname, "..", "components");

/**
 * src/components/<buttons|selects|modals|autocomplete>/*.js
 * Buttons, selects and modals export { customId, run }; autocomplete exports { commandName, run }.
 * A customId matches a component when it is equal or when the part before the first ":" is.
 */
module.exports = (client) => {
  for (const type of Object.keys(client.components)) {
    const key = type === "autocomplete" ? "commandName" : "customId";
    for (const file of jsFiles(path.join(ROOT, type))) {
      const component = require(file);
      if (!component[key] || typeof component.run !== "function") {
        log(`Skipped ${type}/${path.basename(file)}: it needs ${key} and run().`, "warn");
        continue;
      }
      client.components[type].set(component[key], component);
    }
  }
};
