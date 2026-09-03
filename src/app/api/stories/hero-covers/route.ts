import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cached for 1 hour — cover mosaic data changes slowly
export const revalidate = 3600;

export async function GET() {
  const stories = await prisma.story.findMany({
    where: { published: true, coverImage: { not: null } },
    select: { slug: true, title: true, coverImage: true },
    orderBy: { views: "desc" },
    take: 21,
  });
  return NextResponse.json(
    stories.filter((s): s is typeof s & { coverImage: string } => s.coverImage !== null)
  );
}
