// One Map of end times instead of a timer per use, so an idle bot holds almost nothing.
const active = new Map();

const keyOf = (userId, command) => `${userId}:${command}`;

/**
 * Starts a cooldown, or reports what is left of the running one.
 * Returns the milliseconds left, 0 when the command may run.
 */
function hit(userId, command, ms, now = Date.now()) {
  if (!ms || ms <= 0) return 0;
  const key = keyOf(userId, command);
  const end = active.get(key);
  if (end && end > now) return end - now;
  active.set(key, now + ms);
  return 0;
}

/** Gives the wait back, for a command that failed before doing anything. */
const clear = (userId, command) => active.delete(keyOf(userId, command));

function sweep(now = Date.now()) {
  for (const [key, end] of active) if (end <= now) active.delete(key);
}

setInterval(sweep, 60_000).unref();

module.exports = { hit, clear, sweep, size: () => active.size };
