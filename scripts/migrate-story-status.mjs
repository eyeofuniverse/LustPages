import pkg from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const { Client } = pkg;

// Load DATABASE_URL from .env.local
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim()))
    .map(([k, ...v]) => [k, v.join("=").replace(/^["']|["']$/g, "")])
);

const client = new Client({ connectionString: env.DATABASE_URL });
await client.connect();

console.log("Adding status columns to Story table...");

await client.query(`
  ALTER TABLE "Story"
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
    ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMPTZ
`);

// Sync status with existing published state
const { rowCount } = await client.query(`
  UPDATE "Story" SET "status" = 'approved' WHERE "published" = TRUE AND "status" = 'draft'
`);

console.log(`Migration complete. Synced ${rowCount} published stories → status: approved`);
await client.end();
