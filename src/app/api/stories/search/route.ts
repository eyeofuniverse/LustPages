import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const stories = await prisma.story.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { tags: { contains: q.toLowerCase() } },
      ],
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
