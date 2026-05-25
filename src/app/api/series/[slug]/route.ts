import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, slug: true, bio: true, image: true } },
      stories: {
        where: { published: true },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          chapterNumber: true,
          readingTime: true,
          views: true,
          coinPrice: true,
          createdAt: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { chapterNumber: "asc" },
      },
    },
  });

  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(series);
}
