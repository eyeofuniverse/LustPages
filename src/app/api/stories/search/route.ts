import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSearchWhere(query: string) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const tokens = words.length > 0 ? words : [query.trim()];

  const matchToken = (word: string) => ({
    OR: [
      { title: { contains: word, mode: "insensitive" as const } },
      { excerpt: { contains: word, mode: "insensitive" as const } },
      { content: { contains: word, mode: "insensitive" as const } },
      { tags: { contains: word.toLowerCase() } },
    ],
  });

  if (tokens.length === 1) return matchToken(tokens[0]);
  return { AND: tokens.map(matchToken) };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const stories = await prisma.story.findMany({
    where: {
      published: true,
      ...buildSearchWhere(q),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      author: { select: { name: true, slug: true } },
      categories: { select: { name: true, color: true } },
    },
    orderBy: { views: "desc" },
    take: 6,
  });

  return NextResponse.json(stories);
}
