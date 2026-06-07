CREATE TABLE IF NOT EXISTS "SearchSynonym" (
  "id"        TEXT NOT NULL,
  "term"      TEXT NOT NULL,
  "type"      "SynonymType" NOT NULL DEFAULT 'TOKEN',
  "synonyms"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchSynonym_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SearchSynonym_term_key" ON "SearchSynonym"("term");
