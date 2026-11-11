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
  (no wasted command-create quota), with a dev-guild mode for instant updates that cleans up
  after itself when you go global.
- One gate for every command: owner-only, guild-only and per-user cooldowns, the same for slash
  and text commands. A command that fails gives the cooldown back, and a text command on
  cooldown says so once instead of answering every attempt.
- Moderation helper that checks the permissions of both sides, role hierarchy, the server owner and self.
- A row-locked transaction (`/daily`) so parallel clicks cannot double-claim.
- Numbered, idempotent migrations on top of `sequelize.sync()`.
- Per-server settings: a custom prefix per server (`/prefix`), also usable by mentioning the bot.
- A scheduler for things that happen later (`/remind`), safe across restarts and shards.
- Daily JSON backups of every table, kept for 14 days, and `npm run backup`.
- Dependabot for npm, GitHub Actions and Docker.
- Graceful shutdown, errors that always answer the user, a non-zero exit code when the bot cannot
  start (so pm2, systemd and Docker notice), optional sharding.
- Dockerfile with a health check and docker-compose with PostgreSQL, tests that run real commands and events against fake Discord objects, database tests for the transactions, lint, `npm audit` and GitHub Actions with PostgreSQL.

## Setup

You need Node 20+ and a PostgreSQL database.

1. Create an application at the [developer portal](https://discord.com/developers/applications).
   Copy the **Application ID** (`CLIENT_ID`) and, on the **Bot** page, the token (`CLIENT_TOKEN`).
2. On the **Bot** page, enable the **Message Content** intent if you want text commands. If you
   don't, remove `GatewayIntentBits.MessageContent` from `src/client.js` and delete
   `src/commands/prefix`; the bot will not start with an intent the portal has not enabled.
3. Invite the bot with the `bot` and `applications.commands` scopes:
   `https://discord.com/oauth2/authorize?client_id=<CLIENT_ID>&scope=bot+applications.commands`
4. Install and start:

```bash
npm install
cp .env.example .env   # fill in token, client id and database
npm start
```

Or with Docker (starts the bot and PostgreSQL; set `DB_PASSWORD` in `.env` first):

```bash
docker compose up -d --build
```

Set `GUILD_ID` to your test server while developing so commands show up instantly.

### Configuration

Everything is read from `.env` in `src/config.js`.

| Variable | Default | |
| --- | --- | --- |
| `CLIENT_TOKEN`, `CLIENT_ID` | | required |
| `GUILD_ID` | empty | register commands on this server only (instant); empty registers them globally |
| `PREFIX` | `!` | default text command prefix; servers can set their own with `/prefix` |
| `STATUS_TEXT` | `/help` | shown as "Watching ..." under the bot's name |
| `OWNER_ID` | empty | comma separated user ids for `ownerOnly` commands |
| `BACKUP_EVERY_HOURS`, `BACKUP_KEEP`, `BACKUP_DIR` | `24`, `14`, `backups/` | daily JSON backups; `0` hours turns them off |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `puki_core`, `postgres`, empty | PostgreSQL |

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
| `/prefix` | per-server settings in a `Guild` table, cached in memory, permission check inside the command |
| `/remind` | the scheduler: due work claimed with `DELETE ... RETURNING ... SKIP LOCKED`, delivery over REST so any shard can do it |
| `/kick`, `/timeout` | moderation with every safety check |
| `/status` | an owner-only command; the bot status itself is `presence` in `src/client.js` |
| Show avatar (user menu), Message info (message menu) | context menu commands |
| `!ping`, `!say` | text commands with aliases and arguments |

Events: `clientReady`, `interactionCreate`, `messageCreate`, `guildCreate`, `threadCreate`.

## Layout

```
src/
  index.js                         entry point: starts the client, shuts down cleanly
  client.js                        the client: intents, status, collections, startup order
  config.js                        everything read from .env
  database.js                      Sequelize connection, sync and migrations
  commands/
    slash/<Category>/<name>.js     /commands
    user/<Category>/<name>.js      right-click a user
    message/<Category>/<name>.js   right-click a message
    prefix/<Category>/<name>.js    !commands
  components/{buttons,selects,modals,autocomplete}/
  events/                          one file per gateway event
  handlers/                        the loaders and the deploy step
  migrations/                      numbered schema changes
  models/                          Sequelize models (User, Guild, Reminder)
  utils/                           gate, cooldowns, replies, permissions, duration, files, logger
  economy.js                       balance and daily reward
  guildSettings.js                 per-server prefix
  scheduler.js                     reminders that are due
  backup.js                        JSON backups of every table
  shard.js                         optional ShardingManager entry
  health.js                        heartbeat file and the Docker health check
data/                              runtime state (sent commands, heartbeat), not committed
scripts/                           test runner, manual backup
tests/                             unit tests, command flows, database tests
Dockerfile, docker-compose.yml     the bot and PostgreSQL in containers
```

## How a command runs

Slash commands, context menus, text commands and components all take the same path:

1. **Lookup.** Slash commands are found by name, context menus by type and name (`user:Show avatar`,
   `message:Message info`, so a menu may share a name with a slash command), components by
   `customId` or the part before the first `:`.
2. **Gate** (`src/utils/gate.js`): `ownerOnly`, then `guildOnly`, then the per-user `cooldown`.
   The refusal is answered ephemerally for interactions. For text commands a cooldown is
   explained once; further attempts during the same cooldown get no answer, so the warning
   cannot become spam itself.
3. **Run.** If `run` throws, the error is logged, the user is told something went wrong
   (as a follow-up when the command had already replied) and the cooldown is given back.
   The cooldown only slows people down: anything that must never happen twice belongs in the
   database, like the locked transaction in `/daily`.

Text commands are ignored where the bot cannot write, instead of failing on every message.
They work in DMs too, with the default prefix.

## Adding things

A slash command, in `src/commands/slash/<Category>/hello.js`:

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

A context menu goes in `src/commands/user/` or `src/commands/message/` with a
`ContextMenuCommandBuilder` as `structure`, see `src/commands/user/Context/avatar.js`.

A text command, in `src/commands/prefix/<Category>/hi.js`; `args` are the words after the name:

```js
module.exports = {
  structure: { name: "hi", aliases: ["hey"] },
  options: { cooldown: 3 },
  run: async (client, message, args) => {
    await message.reply(`Hi ${args.join(" ") || message.author.displayName}!`);
  },
};
```

A component: export `{ customId, run, options? }` from the matching folder under `src/components/`.
`options` takes the same `ownerOnly`, `guildOnly` and `cooldown` as a command. An id like
`demo:user` is handled by the component called `demo`, so you can carry data after the colon.
A button that only matters inside one command can be awaited there instead (see `/confirm`);
give it an id no component file uses. Autocomplete exports `{ commandName, run }` instead.

An event: export `{ event, once?, run(client, ...args) }` from `src/events/`.

A schema change on an existing table: add `src/migrations/002-what-it-does.js` exporting
`up({ sequelize, transaction })`, written so that running it twice is harmless.

Anything that reads a balance, checks it and writes it back belongs in a transaction with
`lock: transaction.LOCK.UPDATE`, see `claimDaily` in `src/economy.js`.

A file that fails to load (a syntax error, a missing `structure.name` or `run`, a name that is
already taken) is skipped with a line in the log; the rest of the bot still starts.

## Registering slash commands

On start the bot sends its commands to Discord, but only when they changed: a hash of the list is
kept in `data/deploy-cache.json` (a volume in docker-compose, so rebuilds keep it). Delete that
file to force a new registration.

- With `GUILD_ID` set, commands go to that server only and update instantly.
- When you clear `GUILD_ID` to go global, the commands left on that server are removed, otherwise
  it would show every command twice.
- Going the other way, from global to a test server, keeps the global commands (they may be live
  for your users) and logs a warning that the test server shows both. A separate application for
  development avoids that entirely.

## Running in production

- If the bot cannot start (wrong token, an intent not enabled, no database), it exits with code 1.
  Docker (`restart: unless-stopped`), pm2 and systemd's `Restart=on-failure` restart it; check
  the log when it keeps restarting.
- `SIGINT` and `SIGTERM` close the gateway and the database before exiting.
- The Docker image has a health check: while connected to Discord the bot writes
  `data/heartbeat` every 30 seconds, and `node src/health.js` calls it unhealthy once that is
  older than 90 seconds (frozen, or the gateway keeps failing to reconnect). `docker ps` shows the
  state. Docker itself does not restart an unhealthy container; Swarm, Kubernetes or an
  autoheal container do. Outside Docker you can run the same check from your own monitoring.
- Backups land in `backups/` (a volume in docker-compose). They are a safety net, not a
  replacement for `pg_dump`: for a large database, dump it on the server as well.
- Around 2,500 servers Discord requires sharding: `npm run start:sharded`. Each shard is its own
  process, so cooldowns and caches are per shard; the prefix cache stays correct because a server
  belongs to one shard, and reminders are claimed in the database so any shard can send them.

## Upgrading PostgreSQL

docker-compose stays on PostgreSQL 16 on purpose; CI tests 18. A new major version cannot open the
data of an older one, so changing the image tag alone leaves the database unable to start. To move
an existing install to 18:

```bash
docker compose exec db pg_dumpall -U postgres > dump.sql   # 1. dump everything while 16 runs
docker compose down
docker volume rm puki-core_pgdata                          # 2. after checking dump.sql is complete
```

3. In `docker-compose.yml` set `image: postgres:18-alpine` and mount the volume at
   `/var/lib/postgresql` instead of `/var/lib/postgresql/data` (the 18 image keeps its data one
   level deeper).
4. Start only the database, load the dump, then start the rest:

```bash
docker compose up -d db
docker compose exec -T db psql -U postgres < dump.sql
docker compose up -d --build
```

Use your `DB_USER` instead of `postgres` if you changed it. The volume name starts with the folder
name of the project; `docker volume ls` shows it.

## Troubleshooting

| You see | Why |
| --- | --- |
| `Used disallowed intents` | Message Content is not enabled on the Bot page; enable it or remove it from `src/client.js` |
| `An invalid token was provided` | `CLIENT_TOKEN` is wrong or was reset in the portal |
| Slash commands don't appear | global commands can take a while for clients to pick up; set `GUILD_ID` while developing, and check that the invite had `applications.commands` |
| Every command shows twice | the same commands are registered both globally and on that server, see *Registering slash commands* |
| Text commands do nothing | Message Content intent, the server's prefix (mention the bot to see it), or the bot cannot write in that channel |
| Container is `unhealthy` | the bot is not connected to Discord; see its log (`docker compose logs bot`) |
| `Could not save .../deploy-cache.json` | `data/` is not writable; commands still went out, but are sent again on every start |

## Scripts

| Command | |
| --- | --- |
| `npm start` | run the bot |
| `npm run backup` | write a backup now (the running bot also does one a day, see `BACKUP_*` in `.env.example`) |
| `npm run start:sharded` | run it under a ShardingManager (needed around 2,500 servers) |
| `npm test` | unit tests and command flows against fake Discord objects; no database or token needed |
| `TEST_DB_NAME=puki_core_test npm test` | also runs the database tests (locked transactions, rollback, migrations); the database must exist and may be wiped |
| `npm run lint` | eslint |

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md). Security problems
and leaked tokens: see [SECURITY.md](SECURITY.md).

## License

MIT, see [LICENSE](LICENSE).
