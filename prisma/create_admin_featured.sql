CREATE TABLE IF NOT EXISTS "AdminFeaturedItem" (
  "id"        TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "storyId"   TEXT,
  "seriesId"  TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminFeaturedItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminFeaturedItem_story_unique"
  ON "AdminFeaturedItem"("storyId") WHERE "storyId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminFeaturedItem_series_unique"
  ON "AdminFeaturedItem"("seriesId") WHERE "seriesId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "AdminFeaturedItem_type_order_idx"
  ON "AdminFeaturedItem"("type", "order");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AdminFeaturedItem_storyId_fkey'
  ) THEN
    ALTER TABLE "AdminFeaturedItem"
      ADD CONSTRAINT "AdminFeaturedItem_storyId_fkey"
      FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AdminFeaturedItem_seriesId_fkey'
  ) THEN
    ALTER TABLE "AdminFeaturedItem"
      ADD CONSTRAINT "AdminFeaturedItem_seriesId_fkey"
      FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
