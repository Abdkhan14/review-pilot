/**
 * Applies pending Prisma migrations to Turso (libsql) in production.
 *
 * `prisma migrate deploy` targets the native SQLite driver and cannot reach a
 * remote Turso database. This script replicates the same idempotent logic via
 * @libsql/client so Vercel builds keep the Turso schema in sync.
 *
 * Run via: npx tsx scripts/migrate-turso.ts
 * (called from `npm run migrate` when TURSO_DATABASE_URL is set)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "migrations",
);

// Ensure the migration tracking table exists.
await db.execute(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id                      TEXT    PRIMARY KEY,
    checksum                TEXT    NOT NULL,
    finished_at             TEXT,
    migration_name          TEXT    NOT NULL,
    logs                    TEXT,
    rolled_back_at          TEXT,
    started_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
  )
`);

// Collect all migration folders in sorted order.
const folders = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory())
  .sort();

for (const folder of folders) {
  const sqlFile = path.join(MIGRATIONS_DIR, folder, "migration.sql");
  if (!fs.existsSync(sqlFile)) continue;

  // Skip if already recorded in the tracking table.
  const existing = await db.execute({
    sql: "SELECT id FROM _prisma_migrations WHERE migration_name = ?",
    args: [folder],
  });
  if (existing.rows.length > 0) {
    console.log(`  ✓ ${folder} (already applied)`);
    continue;
  }

  const sql = fs.readFileSync(sqlFile, "utf8");
  console.log(`  → applying ${folder}…`);

  // Split on statement boundaries; Turso executes one statement at a time.
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  let skipped = false;
  for (const stmt of statements) {
    const normalized = stmt.endsWith(";") ? stmt : stmt + ";";
    try {
      await db.execute(normalized);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      // If the schema change was already applied before the tracking table
      // existed, treat any DDL conflict as "already done" and move on.
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column name") ||
        msg.includes("already an index named")
      ) {
        console.log(`    (object already exists — marking as applied)`);
        skipped = true;
        break;
      }
      throw err;
    }
  }

  // Record this migration as complete.
  await db.execute({
    sql: `INSERT INTO _prisma_migrations
            (id, checksum, finished_at, migration_name, applied_steps_count)
          VALUES
            (lower(hex(randomblob(16))), '', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?, 1)`,
    args: [folder],
  });

  console.log(`  ✓ ${folder}${skipped ? " (pre-existing)" : ""}`);
}

console.log("Turso migrations complete.");
