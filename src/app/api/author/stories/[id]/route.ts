import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tags-db";

async function requireStoryOwner(storyId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) return null;
  const story = await prisma.story.findFirst({
    where: { id: storyId, authorId: author.id },
  });
  return story ? { author, story } : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ownership = await requireStoryOwner(id);
  if (!ownership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status: currentStatus } = ownership.story;
  if (currentStatus === "pending") {
    return NextResponse.json(
      { error: "Cannot edit a story that is pending review" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { categoryIds, tagIds, authorKeywords, action, coinPrice: incomingCoinPrice } = body;

    const ALLOWED_FIELDS = new Set([
      "title", "slug", "excerpt", "content", "coverImage", "language", "pov",
      "genderPairing", "contentWarnings", "maturityRating", "accessLevel",
      "scheduledAt", "visibility", "commentsEnabled", "metaTitle", "metaDescription",
      "canonicalUrl", "noIndex", "seriesId", "chapterNumber", "authorNote", "tags",
      "readingTime",
    ]);
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) rest[key] = value;
    }
    if (rest.content) rest.content = sanitizeStoryContent(rest.content as string);

    // Series stories cannot have individual coin prices — premium is series-level.
    const targetSeriesId = (
      "seriesId" in rest ? rest.seriesId : ownership.story.seriesId
    ) as string | null;

    let coinPrice: number | null = null;
    if (!targetSeriesId) {
      const rawPrice = incomingCoinPrice != null ? Number(incomingCoinPrice) : null;
      if (rawPrice !== null && (!Number.isInteger(rawPrice) || rawPrice < 1)) {
        return NextResponse.json({ error: "Coin price must be a whole number of at least 1" }, { status: 400 });
      }
      const unlockCount = await prisma.storyUnlock.count({ where: { storyId: id } });
      if (unlockCount > 0 && rawPrice !== ownership.story.coinPrice) {
        coinPrice = ownership.story.coinPrice;
      } else {
        coinPrice = rawPrice;
      }
    }

    if (rest.slug) {
      const slugConflict = await prisma.story.findFirst({
        where: { slug: rest.slug as string, NOT: { id } },
        select: { id: true },
      });
      if (slugConflict) {
        return NextResponse.json({ error: "That slug is already taken by another story." }, { status: 409 });
      }
    }

    const keywordTagIds = await resolveNewTags(authorKeywords ?? [], true);
    const allTagIds = [...(tagIds as string[] ?? []), ...keywordTagIds];

    // For published (approved) stories: keep published/status intact — only update content fields.
    // For drafts/rejected: apply the normal submit/save flow.
    const isPublished = currentStatus === "approved";
    const newStatus = isPublished ? "approved" : (action === "submit" ? "pending" : "draft");

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...rest,
        coinPrice,
        ...(isPublished ? {} : { published: false }),
        status: newStatus,
        rejectionReason: newStatus === "pending" ? null : ownership.story.rejectionReason,
        submittedAt: newStatus === "pending" ? new Date() : ownership.story.submittedAt,
        ...(categoryIds !== undefined && {
          categories: { set: (categoryIds as string[]).map((cid) => ({ id: cid })) },
        }),
        storyTags: {
          set: allTagIds.map((tid) => ({ id: tid })),
        },
      },
    });
    return NextResponse.json(story);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ownership = await requireStoryOwner(id);
  if (!ownership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ownership.story.status === "approved" || ownership.story.status === "pending") {
    return NextResponse.json(
      { error: ownership.story.status === "approved" ? "Cannot delete a published story" : "Cannot delete a story under review" },
      { status: 400 }
    );
  }

  try {
    await prisma.story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
