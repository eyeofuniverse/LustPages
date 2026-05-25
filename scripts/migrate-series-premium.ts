import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres.bxnmkpjqzycucstbphgn:Iamgroot%40123@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Adding Series premium columns...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Series"
    ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "coinPrice" INTEGER,
    ADD COLUMN IF NOT EXISTS "freeChapters" INTEGER NOT NULL DEFAULT 1
  `);
  console.log("✓ Series columns added");

  console.log("Creating SeriesUnlock table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SeriesUnlock" (
      "id"         TEXT NOT NULL,
      "userId"     TEXT NOT NULL,
      "seriesId"   TEXT NOT NULL,
      "coinsSpent" INTEGER NOT NULL,
      "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SeriesUnlock_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SeriesUnlock_userId_seriesId_key'
      ) THEN
        ALTER TABLE "SeriesUnlock"
        ADD CONSTRAINT "SeriesUnlock_userId_seriesId_key" UNIQUE ("userId","seriesId");
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SeriesUnlock_userId_fkey'
      ) THEN
        ALTER TABLE "SeriesUnlock"
        ADD CONSTRAINT "SeriesUnlock_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SeriesUnlock_seriesId_fkey'
      ) THEN
        ALTER TABLE "SeriesUnlock"
        ADD CONSTRAINT "SeriesUnlock_seriesId_fkey"
        FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  console.log("✓ SeriesUnlock table created");

  console.log("Cleaning up Rating.anonymousId...");
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Rating_anonymousId_storyId_key'
      ) THEN
        ALTER TABLE "Rating" DROP CONSTRAINT "Rating_anonymousId_storyId_key";
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Rating" DROP COLUMN IF EXISTS "anonymousId"
  `);
  console.log("✓ Rating.anonymousId removed");

  console.log("Clearing coinPrice from series stories (series controls pricing)...");
  await prisma.$executeRawUnsafe(`
    UPDATE "Story" SET "coinPrice" = NULL WHERE "seriesId" IS NOT NULL AND "coinPrice" IS NOT NULL
  `);
  console.log("✓ Series story prices cleared");

  console.log("All migrations applied successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
