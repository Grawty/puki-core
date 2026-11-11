// One Map of end times instead of a timer per use, so an idle bot holds almost nothing.
// Each entry is { end, warned }: `warned` lets a caller tell the user about the wait only once.
const active = new Map();

const keyOf = (userId, command) => `${userId}:${command}`;

/**
 * Starts a cooldown, or reports what is left of the running one.
 * Returns the milliseconds left, 0 when the command may run.
 */
function hit(userId, command, ms, now = Date.now()) {
  if (!ms || ms <= 0) return 0;
  const key = keyOf(userId, command);
  const entry = active.get(key);
  if (entry && entry.end > now) return entry.end - now;
  active.set(key, { end: now + ms, warned: false });
  return 0;
}

/**
 * True the first time it is asked during a running cooldown, false after that.
 * Used for text commands, where every "slow down" is a message in the channel: answering each
 * repeated attempt would turn the cooldown into the spam it is meant to stop.
 */
function firstWarning(userId, command) {
  const entry = active.get(keyOf(userId, command));
  if (!entry || entry.warned) return false;
  entry.warned = true;
  return true;
}

/** Gives the wait back, for a command that failed. */
const clear = (userId, command) => active.delete(keyOf(userId, command));

function sweep(now = Date.now()) {
  for (const [key, entry] of active) if (entry.end <= now) active.delete(key);
}

setInterval(sweep, 60_000).unref();

module.exports = { hit, firstWarning, clear, sweep, size: () => active.size };
