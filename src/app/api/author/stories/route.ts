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
    const { categoryIds, tagIds, authorKeywords, action, coinPrice: incomingCoinPrice, ...rawData } = await req.json();
    const ALLOWED_CREATE_FIELDS = new Set([
      "title", "slug", "excerpt", "content", "coverImage", "language", "pov",
      "genderPairing", "contentWarnings", "maturityRating", "accessLevel",
      "scheduledAt", "visibility", "commentsEnabled", "metaTitle", "metaDescription",
      "canonicalUrl", "noIndex", "seriesId", "chapterNumber", "authorNote", "readingTime",
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (ALLOWED_CREATE_FIELDS.has(key)) data[key] = value;
    }
    if (data.content) data.content = sanitizeStoryContent(data.content as string);

    // Field-length guards
    if (data.title && (data.title as string).length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or fewer." }, { status: 400 });
    }
    if (data.excerpt && (data.excerpt as string).length > 500) {
      return NextResponse.json({ error: "Excerpt must be 500 characters or fewer." }, { status: 400 });
    }
    if (data.metaTitle && (data.metaTitle as string).length > 120) {
      return NextResponse.json({ error: "Meta title must be 120 characters or fewer." }, { status: 400 });
    }
    if (data.metaDescription && (data.metaDescription as string).length > 320) {
      return NextResponse.json({ error: "Meta description must be 320 characters or fewer." }, { status: 400 });
    }
    if (data.authorNote && (data.authorNote as string).length > 2000) {
      return NextResponse.json({ error: "Author note must be 2000 characters or fewer." }, { status: 400 });
    }

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

    const keywordTagIds = await resolveNewTags(authorKeywords ?? [], true);
    const allTagIds = [...(tagIds ?? []), ...keywordTagIds];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      } as any,
    });
    return NextResponse.json(story, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
