# puki-core

A discord.js v14 bot template (boilerplate) with file based command, event and component loaders.
Drop a file in a folder and you have a command, an event handler or a button; the loaders do the
wiring. PostgreSQL through Sequelize is set up for you.

This is the plumbing of [Puki](https://top.gg/bot/783252170120233001), a Discord bot I run, cleaned up
and cut down to example commands. Puki itself (its card game, economy content and artwork) is not part
of this repository.

Built on discord.js 14.27, so the newer pieces are covered too: Components V2, the new modal inputs,
native polls and user-installable commands.

## What you get

- File based loaders for slash commands, user and message context menus, text (prefix) commands,
  events and components (buttons, selects, modals, autocomplete).
- Slash command deploy that skips Discord when nothing changed since the last start
  (no wasted command-create quota), with a dev-guild mode for instant updates.
- One gate for every command: owner-only, guild-only and per-user cooldowns, the same for slash
  and text commands.
- Moderation helper that checks the permissions of both sides, role hierarchy, the server owner and self.
- A row-locked transaction (`/daily`) so parallel clicks cannot double-claim.
- Numbered, idempotent migrations on top of `sequelize.sync()`.
- Graceful shutdown, errors that always answer the user, optional sharding.
- Dockerfile and docker-compose with PostgreSQL, tests that run real commands and events against fake Discord objects, database tests for the transactions, lint, `npm audit` and GitHub Actions with PostgreSQL.

## Setup

You need Node 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env   # fill in token, client id and database
npm start
```

Or with Docker (starts the bot and PostgreSQL):

```bash
docker compose up -d --build
```

Enable the **Message Content** intent in the developer portal if you want text commands, or remove
`GatewayIntentBits.MessageContent` from `src/client.js` and delete `src/commands/prefix`.
Set `GUILD_ID` while developing so commands show up instantly.

## Examples

Every command here exists to show one thing. Delete `src/commands/slash/Examples` when you start your own bot.

| Command | Shows |
| --- | --- |
| `/ping` + button | buttons, a component that edits its own message |
| `/help` | reading the loaded commands, ephemeral replies |
| `/options` | every option type: choices, autocomplete, ranges, user, channel, role, mentionable, attachment, localizations |
| `/selects` | string, user, role, channel and mentionable select menus |
| `/feedback` | a modal with text, radio group, checkbox group and checkbox |
| `/report` | a modal with user select, string select, paragraph and file upload |
| `/about` | Components V2: container, section, thumbnail, separator, text display, link buttons |
| `/avatar` | Components V2 media gallery, and a command users can install on their own account |
| `/poll` | native Discord polls |
| `/server` | subcommands and subcommand groups, embeds, timestamps |
| `/confirm` | awaiting a button click inside the command, with a timeout |
| `/file` | sending an attachment |
| `/thread` | starting a thread, checking the bot's permission first |
| `/daily`, `/balance`, `/top` | PostgreSQL, a locked transaction, sorted queries |
| `/kick`, `/timeout` | moderation with every safety check |
| `/status` | an owner-only command; the bot status itself is `presence` in `src/client.js` |
| Show avatar (user menu), Message info (message menu) | context menu commands |
| `!ping`, `!say` | text commands with aliases and arguments |

Events: `ready`, `interactionCreate`, `messageCreate`, `guildCreate`, `threadCreate`.

## Layout

```
src/
  commands/
    slash/<Category>/<name>.js     /commands
    user/<Category>/<name>.js      right-click a user
    message/<Category>/<name>.js   right-click a message
    prefix/<Category>/<name>.js    !commands
  components/{buttons,selects,modals,autocomplete}/
  events/                          one file per gateway event
  handlers/                        the loaders and the deploy step
  migrations/                      numbered schema changes
  models/                          Sequelize models
  utils/                           gate, cooldowns, replies, permissions
  economy.js                       balance and daily reward
  shard.js                         optional ShardingManager entry
```

## Adding things

A slash command:

```js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder().setName("hello").setDescription("Say hello"),
  options: { cooldown: 5, guildOnly: false, ownerOnly: false },
  run: async (client, interaction) => {
    await interaction.reply(`Hello ${interaction.user.displayName}!`);
  },
};
```

A component: export `{ customId, run, options? }` from the matching folder under `src/components/`. `options` takes the same `ownerOnly`, `guildOnly` and `cooldown` as a command. An id like
`demo:user` is handled by the component called `demo`, so you can carry data after the colon.
Autocomplete exports `{ commandName, run }` instead.

An event: export `{ event, once?, run(client, ...args) }` from `src/events/`.

A schema change on an existing table: add `src/migrations/002-what-it-does.js` exporting
`up({ sequelize, transaction })`, written so that running it twice is harmless.

Anything that reads a balance, checks it and writes it back belongs in a transaction with
`lock: transaction.LOCK.UPDATE`, see `claimDaily` in `src/economy.js`.

## Scripts

| Command | |
| --- | --- |
| `npm start` | run the bot |
| `npm run start:sharded` | run it under a ShardingManager (needed around 2,500 servers) |
| `npm test` | unit tests and command flows against fake Discord objects; no database needed |
| `TEST_DB_NAME=puki_core_test npm test` | also runs the database tests (locked transactions, rollback, migrations); the database must exist and may be wiped |
| `npm run lint` | eslint |

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE).
