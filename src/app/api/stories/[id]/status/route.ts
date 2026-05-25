import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: storyId } = await params;

  if (session?.user?.id) {
    const userId = session.user.id;
    const [like, bookmark, rating] = await Promise.all([
      prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } }),
      prisma.bookmark.findUnique({ where: { userId_storyId: { userId, storyId } } }),
      prisma.rating.findFirst({ where: { userId, storyId } }),
    ]);
    return NextResponse.json({
      liked: !!like,
      bookmarked: !!bookmark,
      rating: rating?.value ?? null,
    });
  }

  return NextResponse.json({ liked: false, bookmarked: false, rating: null });
}
