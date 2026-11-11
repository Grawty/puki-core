# Security

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately through
[GitHub's private vulnerability reporting](https://github.com/Grawty/puki-core/security/advisories/new)
on this repository, with what you found and how to reproduce it. You should get an answer within a week.

Only the latest version on `main` is supported; fixes are not backported.

## A leaked bot token

If your `CLIENT_TOKEN` ended up in a commit, a log, a screenshot or a paste:

1. Reset it at once on the **Bot** page of the [developer portal](https://discord.com/developers/applications).
   The old token stops working immediately; deleting the commit is not enough, it has already been seen.
2. Put the new token in `.env` and restart the bot.
3. Look at the bot's servers and audit logs for anything it did that you did not.

Discord also scans public GitHub repositories and resets tokens it finds there, so a bot that
suddenly logs `An invalid token was provided` may have had its token leaked.

## Keeping a bot built on this template safe

- `.env` is in `.gitignore`; keep it that way, and never paste tokens in issues.
- Give the bot only the permissions it needs in its invite link, not Administrator.
- Commands that change something check the permission themselves (see `/prefix` and
  `src/utils/permissions.js`): server admins can override a command's default permissions.
- Keep dependencies up to date; Dependabot opens the pull requests and CI runs `npm audit`.
