/**
 * Integration tests run against a real, throwaway Postgres — the same
 * embedded binaries as `npm run db:dev`, but in a temp directory on a free
 * port, so `npm test` needs nothing running and never touches dev data.
 *
 * Setup: start Postgres → `prisma migrate deploy` → demo seed. The seed is
 * destructive, which is exactly why it only ever runs against this database.
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

export default async function setup() {
  const dataDir = mkdtempSync(path.join(tmpdir(), "reverse-test-pg-"));
  const port = await freePort();

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
    onLog: () => {},
    // Postgres refuses to run as root (e.g. in CI containers); the library
    // then runs it as a `postgres` system user that owns the data dir.
    createPostgresUser: process.getuid?.() === 0,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase("reverse_test");

  const url = `postgres://postgres:postgres@127.0.0.1:${port}/reverse_test`;
  process.env.DATABASE_URL = url; // inherited by the test workers

  const run = (cmd: string) =>
    execSync(cmd, { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
  try {
    run("npx prisma migrate deploy");
    run("npx tsx prisma/seed.ts");
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    console.error(e.stdout?.toString(), e.stderr?.toString());
    await pg.stop();
    throw err;
  }

  return async () => {
    await pg.stop();
    rmSync(dataDir, { recursive: true, force: true });
  };
}
