import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildStorySearchWhere } from "@/lib/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const stories = await prisma.story.findMany({
    where: {
      published: true,
      ...buildStorySearchWhere(q),
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
