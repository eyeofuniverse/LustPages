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
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Comment is too long." }, { status: 400 });
  }

  const [comment, story] = await Promise.all([
    prisma.comment.create({
      data: { content: content.trim(), userId: session.user.id, storyId },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } }),
  ]);

  awardBadgesAsync({ type: "COMMENT", userId: session.user.id });
  if (story) awardBadgesAsync({ type: "STORY_COMMENTED", authorId: story.authorId });

  return NextResponse.json(comment, { status: 201 });
}
