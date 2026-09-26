import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the production build (`next start`) with a
 * throwaway, seeded Postgres — see e2e/serve.ts. One worker: the tests
 * share that database and some of them change it (accepting an offer).
 */
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx tsx e2e/serve.ts",
    url: `http://127.0.0.1:${port}`,
    env: { E2E_PORT: String(port) },
    timeout: 240_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
