const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

// One row per server that changed a setting. Add columns here as the bot grows (language, log channel...).
const Guild = sequelize.define("Guild", {
  id: { type: DataTypes.STRING, primaryKey: true },
  prefix: { type: DataTypes.STRING(5), allowNull: true },
}, { tableName: "guilds" });

module.exports = Guild;
