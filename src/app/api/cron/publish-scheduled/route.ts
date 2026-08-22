import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateStory } from "@/lib/revalidate";
import { submitToIndexNow, storyUrl } from "@/lib/indexnow";
import { pushToAll } from "@/lib/onesignal";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find stories due for publishing
  const due = await prisma.story.findMany({
    where: { status: "approved", published: false, scheduledAt: { lte: now } },
    select: {
      id: true, slug: true, title: true, seriesId: true,
      author: { select: { slug: true } },
      seriesInfo: { select: { slug: true } },
    },
  });

  if (due.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  // Publish all at once
  await prisma.story.updateMany({
    where: { id: { in: due.map((s) => s.id) } },
    data: { published: true, scheduledAt: null },
  });

  // Bust ISR caches, submit to search engines, push notifications
  for (const story of due) {
    revalidateStory(story.slug, story.author.slug, story.seriesInfo?.slug ?? undefined);
    submitToIndexNow([storyUrl(story.slug)]);
    pushToAll({
      title: `New story: ${story.title}`,
      body: "Just published on LustPages",
      url: `/stories/${story.slug}`,
    }).catch(console.error);
  }

  return NextResponse.json({
    published: due.length,
    slugs: due.map((s) => s.slug),
  });
}
