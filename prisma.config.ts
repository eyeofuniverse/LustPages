import { defineConfig } from "prisma/config";

// Session-mode pooler (port 5432) — supports DDL/migrations on IPv4 networks.
// Transaction-mode pooler (port 6543) is used at runtime via DATABASE_URL in .env.local.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres.bxnmkpjqzycucstbphgn:Iamgroot%40123@aws-1-us-west-1.pooler.supabase.com:5432/postgres",
  },
});
