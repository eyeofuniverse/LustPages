import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const authorId = searchParams.get("authorId")?.trim() ?? "";

  if (!authorId) return NextResponse.json([]);

  const series = await prisma.series.findMany({
    where: {
      authorId,
      ...(q && { name: { contains: q, mode: "insensitive" } }),
    },
    include: { _count: { select: { stories: true } } },
    orderBy: { name: "asc" },
    take: 8,
  });

  return NextResponse.json(
    series.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      storyCount: s._count.stories,
      nextChapter: s._count.stories + 1,
    }))
  );
}
