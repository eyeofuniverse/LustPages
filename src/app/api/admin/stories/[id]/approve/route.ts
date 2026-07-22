import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendStoryApprovedEmail, sendNewStoryNotification } from "@/lib/email";
import { sendPushToUsers } from "@/lib/push";
import { submitToIndexNow, storyUrl, seriesUrl } from "@/lib/indexnow";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const story = await prisma.story.update({
      where: { id },
      data: { published: true, status: "approved", rejectionReason: null },
      include: {
        author: {
          include: {
            user: { select: { email: true } },
            likes: { include: { user: { select: { email: true, name: true } } } },
          },
        },
        series: { select: { slug: true } },
      },
    });

    // Notify Bing/IndexNow — fire-and-forget
    const indexNowUrls = [storyUrl(story.slug)];
    if (story.series?.slug) indexNowUrls.push(seriesUrl(story.series.slug));
    submitToIndexNow(indexNowUrls);

    // Notify the author
    if (story.author.user?.email) {
      sendStoryApprovedEmail(
        story.author.user.email,
        story.author.name,
        story.title,
        story.slug,
      ).catch(console.error);
    }

    // Notify all followers (fire-and-forget each)
    for (const like of story.author.likes) {
      if (like.user.email) {
        sendNewStoryNotification(
          like.user.email,
          like.user.name,
          story.author.name,
          story.title,
          story.slug,
          story.excerpt,
        ).catch(console.error);
      }
    }

    // Push: notify author their story is live
    if (story.author.userId) {
      sendPushToUsers([story.author.userId], {
        title: "Your story is live!",
        body: `"${story.title}" has been approved and published`,
        url: `/stories/${story.slug}`,
        tag: `approved-${story.id}`,
      }).catch(console.error);
    }

    // Push: notify followers + series readers
    const followerIds = story.author.likes.map((l) => l.userId);
    let seriesReaderIds: string[] = [];
    if (story.seriesId) {
      const readers = await prisma.readingHistory.findMany({
        where: {
          story: { seriesId: story.seriesId },
          userId: { notIn: [...followerIds, ...(story.author.userId ? [story.author.userId] : [])] },
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      seriesReaderIds = readers.map((r) => r.userId);
    }

    const notifyIds = [...new Set([...followerIds, ...seriesReaderIds])].filter(
      (uid) => uid !== story.author.userId,
    );

    if (notifyIds.length > 0) {
      sendPushToUsers(notifyIds, {
        title: story.seriesId ? `New chapter: ${story.title}` : `New story: ${story.title}`,
        body: `${story.author.name} just published`,
        url: `/stories/${story.slug}`,
        tag: `new-story-${story.id}`,
      }).catch(console.error);
    }

    return NextResponse.json(story);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
