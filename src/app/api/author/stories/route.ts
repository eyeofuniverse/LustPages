import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tag-helpers";

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
    const { categoryIds, tagIds, newTagNames, action, coinPrice: incomingCoinPrice, ...data } = await req.json();
    if (data.content) data.content = sanitizeStoryContent(data.content);
    const status = action === "submit" ? "pending" : "draft";
    const coinPrice = data.seriesId ? null : (incomingCoinPrice ?? null);
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
