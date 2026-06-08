ALTER TABLE "TagKeywordRule" DROP CONSTRAINT IF EXISTS "TagKeywordRule_keyword_parentTagId_key";
DROP INDEX IF EXISTS "TagKeywordRule_keyword_key";
DROP INDEX IF EXISTS "TagKeywordRule_keyword_parentTagId_key";
CREATE UNIQUE INDEX "TagKeywordRule_keyword_parentTagId_key" ON "TagKeywordRule"("keyword", "parentTagId");
