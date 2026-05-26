CREATE TABLE IF NOT EXISTS "AdminProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
  "nickname" TEXT,
  "permissions" TEXT[] NOT NULL DEFAULT '{}',
  "invitedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminProfile_userId_key" UNIQUE ("userId"),
  CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AdminProfile_userId_idx" ON "AdminProfile"("userId");

CREATE TABLE IF NOT EXISTS "AdminPasswordOtp" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminPasswordOtp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminPasswordOtp_email_idx" ON "AdminPasswordOtp"("email");

-- Seed super admin profile for existing admin user
INSERT INTO "AdminProfile" ("id", "userId", "isSuperAdmin", "permissions", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, true, '{}', NOW(), NOW()
FROM "User"
WHERE email = 'admin@lustpages.com'
ON CONFLICT ("userId") DO NOTHING;
