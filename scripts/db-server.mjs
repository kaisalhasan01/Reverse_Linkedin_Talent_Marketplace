/**
 * Local dev database: real native PostgreSQL, no Docker or system install.
 *
 * `embedded-postgres` downloads official Postgres binaries into node_modules
 * and runs them against a data directory in the repo (.pgdata/, gitignored).
 * Start with `npm run db:dev` and leave it running next to `npm run dev`.
 *
 * Production uses a hosted Postgres (Supabase) — only DATABASE_URL changes.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(import.meta.dirname, "..", ".pgdata");
const PORT = 5433; // off the default 5432 to avoid clashing with any system Postgres

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

const alreadyInitialised = existsSync(path.join(DATA_DIR, "PG_VERSION"));
if (!alreadyInitialised) {
  console.log("Initialising Postgres data directory (first run)...");
  await pg.initialise();
}

await pg.start();

if (!alreadyInitialised) {
  await pg.createDatabase("reverse");
}

console.log(`\nPostgres running on postgres://postgres:postgres@127.0.0.1:${PORT}/reverse`);
console.log("Press Ctrl+C to stop.\n");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    console.log("\nStopping Postgres...");
    await pg.stop();
    process.exit(0);
  });
}
