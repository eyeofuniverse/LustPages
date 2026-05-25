-- Create Series table
CREATE TABLE IF NOT EXISTS "Series" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "coverImage" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Series_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Series_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Series_slug_key" ON "Series"("slug");
CREATE INDEX IF NOT EXISTS "Series_authorId_idx" ON "Series"("authorId");

-- Add seriesId to Story
ALTER TABLE "Story" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;

-- Add FK constraint idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Story_seriesId_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Story" ADD CONSTRAINT "Story_seriesId_fkey"
      FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
