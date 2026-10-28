// npm run backup: writes one backup now and exits
const { connectDatabase, sequelize } = require("../src/database");
const { runBackup } = require("../src/backup");

(async () => {
  if (!(await connectDatabase())) process.exit(1);
  const { target, tables, rows } = await runBackup();
  console.log(`Backup written to ${target} (${tables} tables, ${rows} rows)`);
  await sequelize.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
