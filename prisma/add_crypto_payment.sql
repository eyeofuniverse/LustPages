CREATE TABLE IF NOT EXISTS "CryptoPayment" (
  "id"              TEXT NOT NULL,
  "nowPaymentId"    TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "packageId"       TEXT NOT NULL,
  "packageName"     TEXT NOT NULL,
  "totalCoins"      INTEGER NOT NULL,
  "subscriberBonus" INTEGER NOT NULL DEFAULT 0,
  "amountUsd"       DOUBLE PRECISION NOT NULL,
  "payCurrency"     TEXT NOT NULL,
  "payAddress"      TEXT NOT NULL,
  "payAmount"       DOUBLE PRECISION NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'waiting',
  "creditedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CryptoPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CryptoPayment_nowPaymentId_key" ON "CryptoPayment"("nowPaymentId");
CREATE INDEX IF NOT EXISTS "CryptoPayment_userId_idx" ON "CryptoPayment"("userId");
CREATE INDEX IF NOT EXISTS "CryptoPayment_status_idx" ON "CryptoPayment"("status");

ALTER TABLE "CryptoPayment"
  ADD CONSTRAINT "CryptoPayment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
