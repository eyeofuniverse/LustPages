import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local so DATABASE_URL is available
const envPath = join(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const eq = line.indexOf("=");
  if (eq < 1) continue;
  const key = line.slice(0, eq).trim();
  const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
  if (key && !process.env[key]) process.env[key] = val;
}

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

function bool(v: number | boolean | null | undefined): boolean {
  return v === 1 || v === true;
}

function date(v: string | null | undefined): Date | null {
  return v ? new Date(v) : null;
}

async function main() {
  const raw = readFileSync(join(process.cwd(), "scripts/exported-data.json"), "utf-8");
  const d = JSON.parse(raw) as Record<string, any[]>;

  console.log("Importing users...");
  if (d.users.length)
    await prisma.user.createMany({
      data: d.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
        image: u.image ?? null,
        bio: u.bio ?? null,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      })),
      skipDuplicates: true,
    });

  console.log("Importing categories...");
  if (d.categories.length)
    await prisma.category.createMany({
      data: d.categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        image: c.image ?? null,
        color: c.color,
        createdAt: new Date(c.createdAt),
      })),
      skipDuplicates: true,
    });

  console.log("Importing authors...");
  if (d.authors.length)
    await prisma.author.createMany({
      data: d.authors.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        bio: a.bio ?? null,
        image: a.image ?? null,
        website: a.website ?? null,
        createdAt: new Date(a.createdAt),
      })),
      skipDuplicates: true,
    });

  console.log("Importing stories...");
  if (d.stories.length)
    await prisma.story.createMany({
      data: d.stories.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt,
        content: s.content,
        coverImage: s.coverImage ?? null,
        published: bool(s.published),
        featured: bool(s.featured),
        views: s.views ?? 0,
        readingTime: s.readingTime ?? 5,
        tags: s.tags ?? "[]",
        categoryId: s.categoryId,
        authorId: s.authorId,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        series: s.series ?? null,
        chapterNumber: s.chapterNumber ?? null,
        language: s.language ?? "English",
        pov: s.pov ?? "Third Person",
        genderPairing: s.genderPairing ?? null,
        contentWarnings: s.contentWarnings ?? "[]",
        maturityRating: s.maturityRating ?? "Explicit",
        accessLevel: s.accessLevel ?? "Free",
        scheduledAt: date(s.scheduledAt),
        visibility: s.visibility ?? "Public",
        commentsEnabled: bool(s.commentsEnabled ?? 1),
        metaTitle: s.metaTitle ?? null,
        metaDescription: s.metaDescription ?? null,
        canonicalUrl: s.canonicalUrl ?? null,
        noIndex: bool(s.noIndex),
        authorNote: s.authorNote ?? null,
        adminNotes: s.adminNotes ?? null,
      })),
      skipDuplicates: true,
    });

  console.log("Importing likes...");
  if (d.likes.length)
    await prisma.like.createMany({
      data: d.likes.map((l) => ({
        id: l.id,
        userId: l.userId,
        storyId: l.storyId,
        createdAt: new Date(l.createdAt),
      })),
      skipDuplicates: true,
    });

  console.log("Importing bookmarks...");
  if (d.bookmarks.length)
    await prisma.bookmark.createMany({
      data: d.bookmarks.map((b) => ({
        id: b.id,
        userId: b.userId,
        storyId: b.storyId,
        createdAt: new Date(b.createdAt),
      })),
      skipDuplicates: true,
    });

  console.log("Importing comments...");
  if (d.comments.length)
    await prisma.comment.createMany({
      data: d.comments.map((c) => ({
        id: c.id,
        content: c.content,
        userId: c.userId,
        storyId: c.storyId,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      skipDuplicates: true,
    });

  const counts = {
    users: d.users.length,
    categories: d.categories.length,
    authors: d.authors.length,
    stories: d.stories.length,
    likes: d.likes.length,
    bookmarks: d.bookmarks.length,
    comments: d.comments.length,
  };
  console.log("\nImport complete:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v} rows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
