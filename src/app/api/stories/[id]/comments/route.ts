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

  const story = await prisma.story.findFirst({
    where: { id: storyId, published: true, commentsEnabled: true },
    select: {
      authorId: true,
      coinPrice: true,
      chapterNumber: true,
      seriesId: true,
      seriesInfo: { select: { isPremium: true, coinPrice: true, freeChapters: true } },
    },
  });
  if (!story) {
    return NextResponse.json({ error: "Story not found or comments are disabled." }, { status: 404 });
  }

  // Access check: premium content requires an unlock record before commenting
  const inSeries = !!story.seriesId && !!story.seriesInfo;
  const seriesPremium = inSeries && !!story.seriesInfo!.isPremium && !!story.seriesInfo!.coinPrice;
  const isFreeChapter = seriesPremium && (story.chapterNumber ?? 1) <= (story.seriesInfo!.freeChapters ?? 1);
  const isPremium = inSeries ? (seriesPremium && !isFreeChapter) : !!story.coinPrice;

  if (isPremium) {
    const userId = session.user.id;
    const hasAccess = seriesPremium
      ? await prisma.seriesUnlock.findUnique({ where: { userId_seriesId: { userId, seriesId: story.seriesId! } } })
      : await prisma.storyUnlock.findUnique({ where: { userId_storyId: { userId, storyId } } });
    if (!hasAccess) {
      return NextResponse.json({ error: "Unlock this story to comment." }, { status: 403 });
    }
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), userId: session.user.id, storyId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  awardBadgesAsync({ type: "COMMENT", userId: session.user.id });
  awardBadgesAsync({ type: "STORY_COMMENTED", authorId: story.authorId });

  return NextResponse.json(comment, { status: 201 });
}
