import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tags-db";

async function requireAuthor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
  });
  return author;
}

export async function POST(req: Request) {
  const author = await requireAuthor();
  if (!author) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { categoryIds, tagIds, newTagNames, action, coinPrice: incomingCoinPrice, ...rawData } = await req.json();
    const ALLOWED_CREATE_FIELDS = new Set([
      "title", "slug", "excerpt", "content", "coverImage", "language", "pov",
      "genderPairing", "contentWarnings", "maturityRating", "accessLevel",
      "scheduledAt", "visibility", "commentsEnabled", "metaTitle", "metaDescription",
      "canonicalUrl", "noIndex", "seriesId", "chapterNumber", "authorNote", "readingTime",
    ]);
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (ALLOWED_CREATE_FIELDS.has(key)) data[key] = value;
    }
    if (data.content) data.content = sanitizeStoryContent(data.content as string);
    const status = action === "submit" ? "pending" : "draft";
    const rawPrice = incomingCoinPrice != null ? Number(incomingCoinPrice) : null;
    if (rawPrice !== null && (!Number.isInteger(rawPrice) || rawPrice < 1)) {
      return NextResponse.json({ error: "Coin price must be a whole number of at least 1" }, { status: 400 });
    }
    const coinPrice = data.seriesId ? null : rawPrice;
    // Ensure slug uniqueness — auto-append -2, -3, … rather than letting the DB throw
    const baseSlug = (data.slug as string) || "";
    let finalSlug = baseSlug;
    for (let i = 2; ; i++) {
      const existing = await prisma.story.findUnique({ where: { slug: finalSlug }, select: { id: true } });
      if (!existing) break;
      finalSlug = `${baseSlug}-${i}`;
    }
    data.slug = finalSlug;

    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const allTagIds = [...(tagIds ?? []), ...pendingTagIds];
    const story = await prisma.story.create({
      data: {
        ...data,
        coinPrice,
        authorId: author.id,
        published: false,
        status,
        submittedAt: status === "pending" ? new Date() : null,
        categories: {
          connect: (categoryIds as string[]).map((id) => ({ id })),
        },
        storyTags: allTagIds.length
          ? { connect: allTagIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    return NextResponse.json(story, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
