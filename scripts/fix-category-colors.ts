import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pickUniqueColor } from "../src/lib/category-colors";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { createdAt: "asc" },
  });

  const assigned: string[] = [];
  for (const cat of categories) {
    const color = pickUniqueColor(assigned);
    assigned.push(color);
    await prisma.category.update({ where: { id: cat.id }, data: { color } });
    console.log(`${cat.name.padEnd(30)} → ${color}`);
  }

  console.log(`\nUpdated ${categories.length} categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
