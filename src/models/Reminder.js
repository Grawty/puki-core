const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Reminder = sequelize.define("Reminder", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.STRING(500), allowNull: false },
  dueAt: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: "reminders",
  indexes: [{ fields: ["dueAt"] }, { fields: ["userId"] }],
});

module.exports = Reminder;
