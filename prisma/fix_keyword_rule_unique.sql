-- Drop old single-column unique constraint on keyword
ALTER TABLE "TagKeywordRule" DROP CONSTRAINT IF EXISTS "TagKeywordRule_keyword_key";

-- Add compound unique constraint so same keyword can have multiple parent tags
ALTER TABLE "TagKeywordRule" ADD CONSTRAINT "TagKeywordRule_keyword_parentTagId_key" UNIQUE (keyword, "parentTagId");
