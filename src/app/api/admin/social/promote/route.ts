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

  const { storyId, caption } = await req.json();
  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

  const story = await prisma.story.findUnique({
    where: { id: storyId, published: true },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      seriesInfo: { select: { coverImage: true } },
    },
  });

  if (!story) {
    return NextResponse.json(
      { error: "Story not found or not published" },
      { status: 404 }
    );
  }

  const url = `${process.env.SITE_URL}/stories/${story.slug}`;
  const text = (caption as string | undefined)?.trim() || story.excerpt;

  const [bsky, tumblr] = await Promise.allSettled([
    postToBluesky({ title: story.title, caption: text, url }),
    postToTumblr({ title: story.title, caption: text, url }),
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
