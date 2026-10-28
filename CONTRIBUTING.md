# Contributing

Thanks for wanting to help. Bug reports, fixes, new examples and docs are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the idea before you spend time on it.
- This is a template: examples should stay small and show one thing. If a change makes the core harder to read, it probably belongs in your own bot instead.

## Setup

You need Node 20+ and PostgreSQL.

```bash
npm ci
cp .env.example .env
```

The tests do not need a Discord token. The database tests need an empty database that may be wiped:

```bash
createdb puki_core_test
TEST_DB_NAME=puki_core_test npm test
```

Without `TEST_DB_NAME` the database tests are skipped, and no test ever touches the database in your `.env`.

## Checks

These run in CI and have to pass:

```bash
npm run lint
npm test
npm audit --omit=dev
```

## Guidelines

- Match the surrounding code. Plain CommonJS, small files, no extra dependencies unless there is a good reason.
- Comments say why, not what. If the code reads clearly, leave it uncommented.
- A new command or component goes in the folder for its type (see the layout in the README) and needs a test that runs it against fake Discord objects, like the ones in `tests/flows.test.js`.
- Anything that reads a value, checks it and writes it back must run in a transaction with a row lock (`claimDaily` in `src/economy.js`).
- A change to an existing table is a new numbered file in `src/migrations`, safe to run twice. Never edit a migration that has been released.
- Never commit tokens, `.env` files or real user data, not even in tests.

## Pull requests

- Keep each pull request to one change, with a short description of what and why.
- Commit messages are short and in the imperative: "Fix cooldown not clearing on error".
- If you changed behaviour, update the README table of examples when it is affected.
