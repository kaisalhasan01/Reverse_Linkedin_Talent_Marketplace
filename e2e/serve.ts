/**
 * The app as production runs it, for the end-to-end tests: a throwaway
 * Postgres (migrated + seeded), then `next start` on a production build.
 * Playwright launches this as its webServer — which matters: the Auth.js
 * UntrustedHost bug only ever showed up under `next start`, never in dev.
 *
 * Builds first unless E2E_SKIP_BUILD is set (CI builds in an earlier step).
 */
import { execSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { startThrowawayDb } from "../tests/support/throwaway-db";

async function main() {
  const port = process.env.E2E_PORT ?? "3100";
  if (!process.env.E2E_SKIP_BUILD) execSync("npx next build", { stdio: "inherit" });

  const db = await startThrowawayDb("reverse_e2e");
  const app = spawn("npx", ["next", "start", "-p", port], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      DATABASE_URL: db.url,
      AUTH_SECRET: randomBytes(33).toString("base64"),
    },
  });

  let stopping = false;
  const shutdown = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    app.kill("SIGTERM");
    await db.stop();
    process.exit(code);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
  app.on("exit", (code) => void shutdown(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
