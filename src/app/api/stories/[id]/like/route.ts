import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardBadgesAsync } from "@/lib/badge-checker";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const userId = session.user.id;

  const story = await prisma.story.findUnique({
    where: { id: storyId, published: true },
    select: { authorId: true },
  });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.authorId === userId) {
    return NextResponse.json({ error: "Cannot like your own story" }, { status: 403 });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_storyId: { userId, storyId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { userId, storyId } });

  awardBadgesAsync({ type: "LIKE", userId });
  awardBadgesAsync({ type: "STORY_LIKED", authorId: story.authorId });

  return NextResponse.json({ liked: true });
}
