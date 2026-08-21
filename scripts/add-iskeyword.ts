// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  // Add isKeyword column if it doesn't exist
  await prisma.$executeRaw`
    ALTER TABLE "Tag"
    ADD COLUMN IF NOT EXISTS "isKeyword" BOOLEAN NOT NULL DEFAULT false
  `;
  console.log("✓ isKeyword column added (or already existed)");
  const count = await prisma.tag.count();
  console.log(`  ${count} tags in database`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
