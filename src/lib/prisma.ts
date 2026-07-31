import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;

function createPrismaClient() {
  // max:1 — each serverless function instance is single-threaded and needs
  // only one connection. Without this, pg defaults to 10, and with many
  // concurrent Vercel instances the 200-connection Supabase limit is hit.
  const adapter = new PrismaPg({ connectionString, max: 1 });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always cache — prevents a new pool being opened on every module evaluation
// in both dev (hot reload) and prod (warm serverless container re-use).
globalForPrisma.prisma = prisma;
