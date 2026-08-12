import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/social/bluesky";
import { postToTumblr } from "@/lib/social/tumblr";
import crypto from "crypto";

// Upload a base64 data URL to Cloudinary server-side.
// Returns the secure_url on success, null on failure.
async function uploadToCloudinary(dataUrl: string): Promise<string | null> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return null;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "story-covers";
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const form = new FormData();
    form.append("file", dataUrl); // Cloudinary accepts data: URIs directly
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.secure_url as string) ?? null;
  } catch {
    return null;
  }
}

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
    imageData,
  } = body as {
    storyId: string;
    platforms?: string[];
    bskyCaption?: string;
    tumblrCaption?: string;
    tags?: string[];
    imageUrl?: string | null;
    imageData?: string;
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

  // Determine image URL:
  // - imageData (base64 DataURL): custom upload → upload to Cloudinary server-side
  // - imageUrl (string): story cover URL passed from client
  // - imageUrl (null): admin chose "no image"
  // - neither: fall back to story's DB cover
  let coverImageUrl: string | null;
  if (typeof imageData === "string" && imageData.startsWith("data:")) {
    coverImageUrl = await uploadToCloudinary(imageData);
  } else if (typeof imageUrl === "string") {
    coverImageUrl = imageUrl;
  } else if (imageUrl === null) {
    coverImageUrl = null;
  } else {
    coverImageUrl = story.coverImage ?? story.seriesInfo?.coverImage ?? null;
  }

  const storyTagNames = story.storyTags
    .filter((t) => t.isApproved)
    .map((t) => t.name);
  const allTags = [...new Set([...(clientTags ?? []), ...storyTagNames])];

  const bskyText = bskyCaption?.trim() || story.excerpt.slice(0, 240);
  const tumblrText = tumblrCaption?.trim() || story.excerpt;

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
