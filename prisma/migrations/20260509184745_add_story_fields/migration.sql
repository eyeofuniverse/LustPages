-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER NOT NULL DEFAULT 5,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "series" TEXT,
    "chapterNumber" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'English',
    "pov" TEXT NOT NULL DEFAULT 'Third Person',
    "genderPairing" TEXT,
    "contentWarnings" TEXT NOT NULL DEFAULT '[]',
    "maturityRating" TEXT NOT NULL DEFAULT 'Explicit',
    "accessLevel" TEXT NOT NULL DEFAULT 'Free',
    "scheduledAt" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'Public',
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "authorNote" TEXT,
    "adminNotes" TEXT,
    CONSTRAINT "Story_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Story" ("authorId", "categoryId", "content", "coverImage", "createdAt", "excerpt", "featured", "id", "published", "readingTime", "slug", "tags", "title", "updatedAt", "views") SELECT "authorId", "categoryId", "content", "coverImage", "createdAt", "excerpt", "featured", "id", "published", "readingTime", "slug", "tags", "title", "updatedAt", "views" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
