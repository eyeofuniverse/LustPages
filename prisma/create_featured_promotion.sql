CREATE TABLE IF NOT EXISTS "FeaturedPromotion" (
  "id"         TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "storyId"    TEXT,
  "seriesId"   TEXT,
  "authorId"   TEXT NOT NULL,
  "coinsSpent" INTEGER NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'queued',
  "startedAt"  TIMESTAMP(3),
  "expiresAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeaturedPromotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FeaturedPromotion_type_status_idx"
  ON "FeaturedPromotion"("type", "status");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FeaturedPromotion_storyId_fkey'
  ) THEN
    ALTER TABLE "FeaturedPromotion"
      ADD CONSTRAINT "FeaturedPromotion_storyId_fkey"
      FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FeaturedPromotion_seriesId_fkey'
  ) THEN
    ALTER TABLE "FeaturedPromotion"
      ADD CONSTRAINT "FeaturedPromotion_seriesId_fkey"
      FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FeaturedPromotion_authorId_fkey'
  ) THEN
    ALTER TABLE "FeaturedPromotion"
      ADD CONSTRAINT "FeaturedPromotion_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
