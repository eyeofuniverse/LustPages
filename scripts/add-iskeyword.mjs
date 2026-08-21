// Adds isKeyword column to Tag table. Run once with:
// node --env-file=.env.local scripts/add-iskeyword.mjs
import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

try {
  await client.query(
    `ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "isKeyword" BOOLEAN NOT NULL DEFAULT false`
  );
  console.log("✓ isKeyword column added (or already existed)");

  const { rows } = await client.query(`SELECT COUNT(*) as count FROM "Tag"`);
  console.log(`  ${rows[0].count} tags in database`);
} finally {
  await client.end();
}
