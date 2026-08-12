import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/social/bluesky";
import { postToTumblr } from "@/lib/social/tumblr";

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { storyId, bskyCaption, tumblrCaption, tags: clientTags } =
    await req.json();
  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

  const story = await prisma.story.findUnique({
    where: { id: storyId, published: true },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      seriesInfo: { select: { coverImage: true } },
      storyTags: { select: { name: true, isApproved: true } },
    },
  });

  if (!story) {
    return NextResponse.json(
      { error: "Story not found or not published" },
      { status: 404 }
    );
  }

  const url = `${process.env.SITE_URL}/stories/${story.slug}`;
  const coverImageUrl = story.coverImage ?? story.seriesInfo?.coverImage ?? null;

  const storyTagNames = story.storyTags
    .filter((t) => t.isApproved)
    .map((t) => t.name);
  const allTags = [...new Set([...(clientTags ?? []), ...storyTagNames])];

  const bskyText =
    (bskyCaption as string | undefined)?.trim() || story.excerpt.slice(0, 270);
  const tumblrText =
    (tumblrCaption as string | undefined)?.trim() || story.excerpt;

  const [bsky, tumblr] = await Promise.allSettled([
    postToBluesky({
      title: story.title,
      caption: bskyText,
      url,
      tags: allTags,
      coverImageUrl,
    }),
    postToTumblr({
      title: story.title,
      caption: tumblrText,
      url,
      tags: allTags,
      coverImageUrl,
    }),
  ]);

  return NextResponse.json({
    bluesky:
      bsky.status === "fulfilled"
        ? { ok: true }
        : { ok: false, error: (bsky as PromiseRejectedResult).reason?.message },
    tumblr:
      tumblr.status === "fulfilled"
        ? { ok: true }
        : { ok: false, error: (tumblr as PromiseRejectedResult).reason?.message },
  });
}
