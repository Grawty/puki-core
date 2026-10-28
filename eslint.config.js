const globals = Object.fromEntries(
  ["require", "module", "exports", "process", "console", "Buffer", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "URL", "__dirname", "__filename"]
    .map((name) => [name, "readonly"]),
);

module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: { ecmaVersion: 2024, sourceType: "commonjs", globals },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
