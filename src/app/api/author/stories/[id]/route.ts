import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tag-helpers";

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
  if (currentStatus === "pending" || currentStatus === "approved") {
    return NextResponse.json(
      { error: "Cannot edit a story that is pending review or published" },
      { status: 400 }
    );
  }

  try {
    const { categoryIds, tagIds, newTagNames, action, coinPrice: incomingCoinPrice, ...rest } = await req.json();
    if (rest.content) rest.content = sanitizeStoryContent(rest.content);

    // Series stories cannot have individual coin prices — premium is series-level.
    // Derive where the story will actually live after this update; fall back to the
    // current DB value when seriesId wasn't included in the request body at all.
    const targetSeriesId = (
      "seriesId" in rest ? rest.seriesId : ownership.story.seriesId
    ) as string | null;

    let coinPrice: number | null = null;
    if (!targetSeriesId) {
      // Standalone story: apply price lock logic
      const unlockCount = await prisma.storyUnlock.count({ where: { storyId: id } });
      if (unlockCount > 0 && incomingCoinPrice !== ownership.story.coinPrice) {
        coinPrice = ownership.story.coinPrice; // silently preserve original price
      } else {
        coinPrice = incomingCoinPrice ?? null;
      }
    }

    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const allTagIds = [...(tagIds as string[] ?? []), ...pendingTagIds];
    const newStatus = action === "submit" ? "pending" : "draft";
    const story = await prisma.story.update({
      where: { id },
      data: {
        ...rest,
        coinPrice,
        published: false,
        status: newStatus,
        rejectionReason: newStatus === "pending" ? null : ownership.story.rejectionReason,
        submittedAt: newStatus === "pending" ? new Date() : ownership.story.submittedAt,
        categories: {
          set: (categoryIds as string[]).map((cid) => ({ id: cid })),
        },
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

  if (ownership.story.status === "approved") {
    return NextResponse.json(
      { error: "Cannot delete a published story" },
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
