// Adds suspended column to User table. Run once with:
// node --env-file=.env.local scripts/add-suspended.mjs
import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

try {
  await client.query(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN NOT NULL DEFAULT false`
  );
  console.log("✓ suspended column added (or already existed)");
} finally {
  await client.end();
}
