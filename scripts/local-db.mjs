import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const dir = resolve(".local/postgres");
mkdirSync(resolve(".local"), { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "sme",
  password: "sme_local_dev",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: (e) => console.error("[DB]", String(e)),
});
if (!existsSync(resolve(dir, "PG_VERSION"))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const result = await client.query(
  "SELECT 1 FROM pg_database WHERE datname='sme_chamber_utf8'",
);
if (!result.rowCount)
  await client.query(
    "CREATE DATABASE sme_chamber_utf8 TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'",
  );
await client.end();
console.log(
  "[DB] PostgreSQL ready on localhost:5432. Keep this process running.",
);
async function stop() {
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
