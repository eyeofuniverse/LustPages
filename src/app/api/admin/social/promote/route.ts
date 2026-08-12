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

  const body = await req.json();
  const {
    storyId,
    platforms,
    bskyCaption,
    tumblrCaption,
    tags: clientTags,
    imageUrl,
  } = body as {
    storyId: string;
    platforms?: string[];
    bskyCaption?: string;
    tumblrCaption?: string;
    tags?: string[];
    imageUrl?: string | null;
  };

  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

  const activePlatforms =
    Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ["bluesky", "tumblr"];

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

  // imageUrl from client: null = no image, string = use that URL, undefined = story cover
  const coverImageUrl =
    typeof imageUrl === "string"
      ? imageUrl
      : imageUrl === null
      ? null
      : (story.coverImage ?? story.seriesInfo?.coverImage ?? null);

  const storyTagNames = story.storyTags
    .filter((t) => t.isApproved)
    .map((t) => t.name);
  const allTags = [...new Set([...(clientTags ?? []), ...storyTagNames])];

  const bskyText =
    bskyCaption?.trim() || story.excerpt.slice(0, 270);
  const tumblrText =
    tumblrCaption?.trim() || story.excerpt;

  const result: Record<string, { ok: boolean; error?: string }> = {};

  const tasks: Array<[string, Promise<unknown>]> = [];

  if (activePlatforms.includes("bluesky")) {
    tasks.push([
      "bluesky",
      postToBluesky({
        title: story.title,
        caption: bskyText,
        url,
        tags: allTags,
        coverImageUrl,
      }),
    ]);
  }
  if (activePlatforms.includes("tumblr")) {
    tasks.push([
      "tumblr",
      postToTumblr({
        title: story.title,
        caption: tumblrText,
        url,
        tags: allTags,
        coverImageUrl,
      }),
    ]);
  }

  const settled = await Promise.allSettled(tasks.map(([, p]) => p));
  tasks.forEach(([platform], i) => {
    const s = settled[i];
    result[platform] =
      s.status === "fulfilled"
        ? { ok: true }
        : { ok: false, error: (s as PromiseRejectedResult).reason?.message };
  });

  return NextResponse.json(result);
}
