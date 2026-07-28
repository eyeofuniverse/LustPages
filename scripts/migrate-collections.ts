import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Creating Collection table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Collection" (
      "id"              TEXT NOT NULL,
      "slug"            TEXT NOT NULL,
      "title"           TEXT NOT NULL,
      "description"     TEXT,
      "metaDescription" TEXT,
      "coverImage"      TEXT,
      "type"            TEXT NOT NULL DEFAULT 'editorial',
      "featured"        BOOLEAN NOT NULL DEFAULT false,
      "published"       BOOLEAN NOT NULL DEFAULT true,
      "sortOrder"       INTEGER NOT NULL DEFAULT 0,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Collection_published_featured_sortOrder_idx"
    ON "Collection"("published", "featured", "sortOrder")
  `);
  console.log("✓ Collection table created");

  console.log("Creating CollectionStory table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CollectionStory" (
      "id"            TEXT NOT NULL,
      "collectionId"  TEXT NOT NULL,
      "storyId"       TEXT NOT NULL,
      "position"      INTEGER NOT NULL DEFAULT 0,
      "editorialNote" TEXT,
      "addedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CollectionStory_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CollectionStory_collectionId_fkey'
      ) THEN
        ALTER TABLE "CollectionStory"
          ADD CONSTRAINT "CollectionStory_collectionId_fkey"
          FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CollectionStory_storyId_fkey'
      ) THEN
        ALTER TABLE "CollectionStory"
          ADD CONSTRAINT "CollectionStory_storyId_fkey"
          FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CollectionStory_collectionId_storyId_key"
    ON "CollectionStory"("collectionId", "storyId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CollectionStory_collectionId_position_idx"
    ON "CollectionStory"("collectionId", "position")
  `);
  console.log("✓ CollectionStory table created");

  console.log("All done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
