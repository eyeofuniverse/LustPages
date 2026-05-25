import { defineConfig } from "prisma/config";

// Session-mode pooler (port 5432) — supports DDL/migrations on IPv4 networks.
// Transaction-mode pooler (port 6543) is used at runtime via DATABASE_URL in .env.local.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "***REDACTED-USE-DIRECT_URL-ENV-VAR***",
  },
});
