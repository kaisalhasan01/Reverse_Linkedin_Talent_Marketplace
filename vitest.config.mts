import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Two projects:
 *  - unit:        pure functions (CV parser, formatting, validation) — no DB, runs in ms
 *  - integration: the data layer against a real, throwaway Postgres that
 *                 tests/integration/global-setup.ts starts, migrates and seeds
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/global-setup.ts"],
          // One shared database: run files one at a time so fixtures don't race.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
