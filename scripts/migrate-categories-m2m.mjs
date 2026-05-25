// Migrates Story.categoryId (FK) → _CategoryToStory (many-to-many join table)
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const dbUrl = env.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found in .env.local");

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
console.log("Connected to Supabase");

try {
  await client.query("BEGIN");

  // 1. Create join table (idempotent)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_CategoryToStory" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `);

  // Add unique constraint (skip if already exists)
  const { rows: uq } = await client.query(`
    SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToStory_AB_unique'
  `);
  if (!uq.length) {
    await client.query(`ALTER TABLE "_CategoryToStory" ADD CONSTRAINT "_CategoryToStory_AB_unique" UNIQUE ("A", "B")`);
  }

  // Add index (skip if exists)
  const { rows: idx } = await client.query(`
    SELECT 1 FROM pg_indexes WHERE indexname = '_CategoryToStory_B_index'
  `);
  if (!idx.length) {
    await client.query(`CREATE INDEX "_CategoryToStory_B_index" ON "_CategoryToStory"("B")`);
  }

  // Add FK A (Category)
  const { rows: fkA } = await client.query(`
    SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToStory_A_fkey'
  `);
  if (!fkA.length) {
    await client.query(`
      ALTER TABLE "_CategoryToStory"
      ADD CONSTRAINT "_CategoryToStory_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  // Add FK B (Story)
  const { rows: fkB } = await client.query(`
    SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToStory_B_fkey'
  `);
  if (!fkB.length) {
    await client.query(`
      ALTER TABLE "_CategoryToStory"
      ADD CONSTRAINT "_CategoryToStory_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  console.log("Join table ready");

  // 2. Migrate existing categoryId data (only if column still exists)
  const { rows: col } = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Story' AND column_name = 'categoryId'
  `);
  if (col.length) {
    const { rowCount } = await client.query(`
      INSERT INTO "_CategoryToStory" ("A", "B")
      SELECT "categoryId", "id" FROM "Story"
      WHERE "categoryId" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    console.log(`Migrated ${rowCount} story-category rows`);

    // 3. Drop old FK and column
    await client.query(`ALTER TABLE "Story" DROP CONSTRAINT IF EXISTS "Story_categoryId_fkey"`);
    await client.query(`ALTER TABLE "Story" DROP COLUMN "categoryId"`);
    console.log("Dropped categoryId column");
  } else {
    console.log("categoryId already removed, skipping data migration");
  }

  await client.query("COMMIT");
  console.log("Migration complete");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Migration failed, rolled back:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
