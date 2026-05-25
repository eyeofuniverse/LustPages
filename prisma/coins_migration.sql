-- Add coinBalance to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coinBalance" INTEGER NOT NULL DEFAULT 0;

-- Add coinPrice to Story (null = free, integer = coins required to unlock)
ALTER TABLE "Story" ADD COLUMN IF NOT EXISTS "coinPrice" INTEGER;

-- Add coinEarnings to Author
ALTER TABLE "Author" ADD COLUMN IF NOT EXISTS "coinEarnings" INTEGER NOT NULL DEFAULT 0;

-- CoinPackage table
CREATE TABLE IF NOT EXISTS "CoinPackage" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "coins"       INTEGER NOT NULL,
  "bonusCoins"  INTEGER NOT NULL DEFAULT 0,
  "price"       DOUBLE PRECISION NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoinPackage_pkey" PRIMARY KEY ("id")
);

-- CoinTransaction table
CREATE TABLE IF NOT EXISTS "CoinTransaction" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "amount"      INTEGER NOT NULL,
  "type"        TEXT NOT NULL,
  "description" TEXT,
  "packageId"   TEXT,
  "storyId"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CoinTransaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- StoryUnlock table
CREATE TABLE IF NOT EXISTS "StoryUnlock" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "storyId"    TEXT NOT NULL,
  "coinsSpent" INTEGER NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoryUnlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryUnlock_userId_storyId_key" UNIQUE ("userId", "storyId"),
  CONSTRAINT "StoryUnlock_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryUnlock_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tip table
CREATE TABLE IF NOT EXISTS "Tip" (
  "id"            TEXT NOT NULL,
  "fromUserId"    TEXT NOT NULL,
  "toAuthorId"    TEXT NOT NULL,
  "storyId"       TEXT,
  "amount"        INTEGER NOT NULL,
  "authorShare"   INTEGER NOT NULL,
  "platformShare" INTEGER NOT NULL,
  "message"       TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tip_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Tip_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Tip_toAuthorId_fkey"
    FOREIGN KEY ("toAuthorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Tip_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Seed default coin packages
INSERT INTO "CoinPackage" ("id","name","description","coins","bonusCoins","price","isActive","order")
VALUES
  ('pkg_starter', 'Starter',  'Perfect for trying out premium content',  10,   0,  10.00, true, 1),
  ('pkg_popular', 'Popular',  '10% bonus coins included',                50,   5,  50.00, true, 2),
  ('pkg_pro',     'Pro',      '15% bonus coins — best value',           100,  15, 100.00, true, 3),
  ('pkg_elite',   'Elite',    '20% bonus coins — maximum value',        500, 100, 500.00, true, 4)
ON CONFLICT ("id") DO NOTHING;
