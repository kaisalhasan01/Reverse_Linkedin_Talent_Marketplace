/**
 * Integration tests run against a real, throwaway Postgres (migrated +
 * seeded) — see tests/support/throwaway-db.ts.
 */
import { startThrowawayDb } from "../support/throwaway-db";

export default async function setup() {
  const db = await startThrowawayDb();
  process.env.DATABASE_URL = db.url; // inherited by the test workers
  return db.stop;
}
