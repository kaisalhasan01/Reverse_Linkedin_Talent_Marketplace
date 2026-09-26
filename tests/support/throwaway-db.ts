/**
 * A real, throwaway Postgres for tests — the same embedded binaries as
 * `npm run db:dev`, but in a temp directory on a free port, migrated and
 * seeded with the demo data. Used by the integration tests (Vitest) and the
 * end-to-end tests (Playwright); nothing needs to be running beforehand and
 * dev data is never touched. The seed is destructive, which is exactly why
 * it only ever runs against a database like this one.
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

export function freePort(): Promise<number> {
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

export async function startThrowawayDb(name = "reverse_test") {
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
  await pg.createDatabase(name);

  const url = `postgres://postgres:postgres@127.0.0.1:${port}/${name}`;
  const stop = async () => {
    await pg.stop();
    rmSync(dataDir, { recursive: true, force: true });
  };

  const run = (cmd: string) => execSync(cmd, { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
  try {
    run("npx prisma migrate deploy");
    run("npx tsx prisma/seed.ts");
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    console.error(e.stdout?.toString(), e.stderr?.toString());
    await stop();
    throw err;
  }

  return { url, stop };
}
