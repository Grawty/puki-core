// Speeds up /top, which sorts every user by coins
module.exports = {
  up: ({ sequelize, transaction }) =>
    sequelize.query("CREATE INDEX IF NOT EXISTS users_coins_idx ON users (coins DESC)", { transaction }),
};
