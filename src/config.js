require("dotenv").config();

const list = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);

module.exports = {
  token: process.env.CLIENT_TOKEN,
  clientId: process.env.CLIENT_ID,
  devGuildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || "!",
  owners: new Set(list(process.env.OWNER_ID)),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "puki_core",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
};
