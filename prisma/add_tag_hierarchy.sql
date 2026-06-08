CREATE TABLE IF NOT EXISTS "TagRelationship" (
  "id"       TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "childId"  TEXT NOT NULL,
  CONSTRAINT "TagRelationship_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TagRelationship_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tag"("id") ON DELETE CASCADE,
  CONSTRAINT "TagRelationship_childId_fkey"  FOREIGN KEY ("childId")  REFERENCES "Tag"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "TagRelationship_parentId_childId_key" ON "TagRelationship"("parentId", "childId");
CREATE INDEX IF NOT EXISTS "TagRelationship_parentId_idx" ON "TagRelationship"("parentId");
CREATE INDEX IF NOT EXISTS "TagRelationship_childId_idx"  ON "TagRelationship"("childId");

CREATE TABLE IF NOT EXISTS "TagKeywordRule" (
  "id"          TEXT NOT NULL,
  "keyword"     TEXT NOT NULL,
  "parentTagId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TagKeywordRule_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "TagKeywordRule_parentTagId_fkey" FOREIGN KEY ("parentTagId") REFERENCES "Tag"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "TagKeywordRule_keyword_key"       ON "TagKeywordRule"("keyword");
CREATE INDEX        IF NOT EXISTS "TagKeywordRule_parentTagId_idx"   ON "TagKeywordRule"("parentTagId");
