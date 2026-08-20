import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendStoryApprovedEmail, sendNewStoryNotification } from "@/lib/email";
import { sendPushToUsers } from "@/lib/push";
import { pushToAll } from "@/lib/onesignal";
import { submitToIndexNow, storyUrl, seriesUrl } from "@/lib/indexnow";
import { awardBadgesAsync } from "@/lib/badge-checker";
import { revalidateStory } from "@/lib/revalidate";

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
    const existing = await prisma.story.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return NextResponse.json({ error: "Story not found" }, { status: 404 });
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Only pending stories can be approved" }, { status: 400 });
    }

    const story = await prisma.story.update({
      where: { id },
      data: { published: true, status: "approved", rejectionReason: null, scheduledAt: null },
      include: {
        author: {
          include: {
            user: { select: { email: true } },
            likes: { include: { user: { select: { email: true, name: true } } } },
          },
        },
        seriesInfo: { select: { slug: true } },
      },
    });

    // Notify Bing/IndexNow — fire-and-forget
    const indexNowUrls = [storyUrl(story.slug)];
    if (story.seriesInfo?.slug) indexNowUrls.push(seriesUrl(story.seriesInfo.slug));
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

    // Push: broadcast new story to all subscribers
    pushToAll({
      title: story.seriesId ? `New chapter: ${story.title}` : `New story: ${story.title}`,
      body: `${story.author.name} just published on LustPages`,
      url: `/stories/${story.slug}`,
    }).catch(console.error);

    awardBadgesAsync({ type: "STORY_PUBLISH", authorId: story.authorId });

    // Bust cached pages immediately — story is now live
    revalidateStory(story.slug, story.author.slug, story.seriesInfo?.slug ?? undefined);

    return NextResponse.json(story);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
