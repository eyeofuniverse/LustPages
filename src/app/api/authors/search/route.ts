import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const authors = await prisma.author.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      stories: { some: { published: true } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { stories: { where: { published: true } } } },
    },
    orderBy: { stories: { _count: "desc" } },
    take: 4,
  });

  return NextResponse.json(authors);
}
