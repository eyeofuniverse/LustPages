import { defineConfig } from "prisma/config";

// DIRECT_URL: direct Supabase connection (no pooler) — required for DDL/migrations.
// Set this in .env.local. DATABASE_URL uses the transaction-mode pooler (port 6543)
// for runtime queries and must NOT be used here.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
