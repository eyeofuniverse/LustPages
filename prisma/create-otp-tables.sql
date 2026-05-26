CREATE TABLE IF NOT EXISTS "AdminOtp" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminOtp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminOtp_email_idx" ON "AdminOtp"("email");

CREATE TABLE IF NOT EXISTS "AdminPreAuth" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminPreAuth_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminPreAuth_token_key" UNIQUE ("token")
);
CREATE INDEX IF NOT EXISTS "AdminPreAuth_email_idx" ON "AdminPreAuth"("email");
