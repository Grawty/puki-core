const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const User = sequelize.define("User", {
  id: { type: DataTypes.STRING, primaryKey: true },
  coins: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  lastDaily: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "users" });

module.exports = User;
