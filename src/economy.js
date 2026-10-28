const { sequelize } = require("./database");
const { User } = require("./models");

const DAILY_COINS = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Milliseconds until the next daily claim, 0 when it can be claimed now. */
function dailyWait(lastDaily, now = Date.now()) {
  if (!lastDaily) return 0;
  return Math.max(0, new Date(lastDaily).getTime() + DAY_MS - now);
}

async function balanceOf(userId) {
  const user = await User.findByPk(userId);
  return user ? user.coins : 0;
}

/**
 * Pays the daily reward. The row is locked for the whole read-check-write, so two clicks
 * arriving together cannot both pass the check.
 * Resolves to { ok: true, coins, reward } or { ok: false, wait }.
 */
function claimDaily(userId) {
  return sequelize.transaction(async (transaction) => {
    await User.findOrCreate({ where: { id: userId }, transaction });
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });

    const wait = dailyWait(user.lastDaily);
    if (wait > 0) return { ok: false, wait };

    user.coins += DAILY_COINS;
    user.lastDaily = new Date();
    await user.save({ transaction });
    return { ok: true, coins: user.coins, reward: DAILY_COINS };
  });
}

module.exports = { balanceOf, claimDaily, dailyWait, DAILY_COINS };
