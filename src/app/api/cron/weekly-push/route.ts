import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushToAll } from "@/lib/onesignal";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Top story published in the last 7 days by views, then rating
  const story = await prisma.story.findFirst({
    where: { published: true, createdAt: { gte: weekAgo } },
    orderBy: [{ views: "desc" }, { ratingAvg: "desc" }],
    select: {
      title: true,
      slug: true,
      coverImage: true,
      author: { select: { name: true } },
      seriesInfo: { select: { coverImage: true } },
    },
  });

  if (!story) {
    return NextResponse.json({ ok: true, message: "No new stories this week — skipped" });
  }

  const imageUrl = story.coverImage ?? story.seriesInfo?.coverImage ?? undefined;

  await pushToAll({
    title: "🔥 Trending this week on LustPages",
    body: `"${story.title}" by ${story.author.name} is this week's hottest read`,
    url: `/stories/${story.slug}`,
    imageUrl,
  });

  return NextResponse.json({ ok: true, story: story.title });
}
