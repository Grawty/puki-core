# puki-core

A discord.js v14 bot template (boilerplate) with file based command, event and component loaders.
Drop a file in a folder and you have a command, an event handler or a button; the loaders do the
wiring. PostgreSQL through Sequelize is set up for you.

This is the plumbing of [Puki](https://top.gg/bot/783252170120233001), a Discord bot I run, cleaned up
and cut down to a handful of example commands. Puki itself (its card game, economy content and
artwork) is not part of this repository.

## What you get

- File based loaders for slash commands, user/message context menus, text (prefix) commands,
  events and components (buttons, selects, modals, autocomplete).
- Slash command deploy that skips Discord when nothing changed since the last start
  (no wasted command-create quota), with a dev-guild mode for instant updates.
- One gate for every command: owner-only, guild-only and per-user cooldowns, the same for slash
  and text commands.
- Moderation helper that checks permissions of both sides, role hierarchy, the server owner and self.
- A row-locked transaction example (`/daily`) so parallel clicks cannot double-claim.
- Graceful shutdown, no-nonsense error handling that always answers the user.
- Tests that need no database, lint, GitHub Actions.

## Setup

You need Node 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env   # fill in token, client id and database
npm start
```

Enable the **Message Content** intent in the developer portal if you want text commands, or remove
`GatewayIntentBits.MessageContent` from `src/client.js` and delete `src/commands/prefix`.
Tables are created on first start.

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
  models/                          Sequelize models
  utils/                           gate, cooldowns, replies, permissions
  economy.js                       balance and daily reward
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

A button: export `{ customId, run }` from `src/components/buttons/`. An id like `ping:refresh`
is handled by the component called `ping`, so you can carry data after the colon.

An event: export `{ event, once?, run(client, ...args) }` from `src/events/`.

Anything that reads a balance, checks it and writes it back belongs in a transaction with
`lock: transaction.LOCK.UPDATE`, see `claimDaily` in `src/economy.js`.

## Scripts

| Command | |
| --- | --- |
| `npm start` | run the bot |
| `npm test` | unit tests (no database needed) |
| `npm run lint` | eslint |

## License

MIT, see [LICENSE](LICENSE).
