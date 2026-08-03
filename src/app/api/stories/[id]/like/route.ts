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

  const existing = await prisma.like.findUnique({
    where: { userId_storyId: { userId, storyId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  const [, story] = await Promise.all([
    prisma.like.create({ data: { userId, storyId } }),
    prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } }),
  ]);

  awardBadgesAsync({ type: "LIKE", userId });
  if (story) awardBadgesAsync({ type: "STORY_LIKED", authorId: story.authorId });

  return NextResponse.json({ liked: true });
}
