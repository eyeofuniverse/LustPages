import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tags-db";
import { submitToIndexNow, storyUrl } from "@/lib/indexnow";
import { pushToAll } from "@/lib/onesignal";
import { revalidateStory } from "@/lib/revalidate";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const ALLOWED_ADMIN_FIELDS = new Set([
      "title", "slug", "excerpt", "content", "coverImage", "language", "pov",
      "genderPairing", "contentWarnings", "maturityRating", "accessLevel",
      "scheduledAt", "visibility", "commentsEnabled", "metaTitle", "metaDescription",
      "canonicalUrl", "noIndex", "seriesId", "chapterNumber", "authorNote", "readingTime",
      "published", "featured", "status", "authorId", "views", "coinPrice",
      "adminNotes", "rejectionReason", "series",
    ]);
    const raw = await req.json();
    const { categoryIds, tagIds, newTagNames, authorKeywords } = raw;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (ALLOWED_ADMIN_FIELDS.has(key)) data[key] = value;
    }
    if (data.content) data.content = sanitizeStoryContent(data.content);
    const statusUpdate =
      "published" in data || "scheduledAt" in data
        ? { status: data.published || data.scheduledAt ? "approved" : "draft" }
        : {};
    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const keywordTagIds = await resolveNewTags(authorKeywords ?? [], true);
    const combinedPending = [...pendingTagIds, ...keywordTagIds];
    const allTagIds = tagIds !== undefined
      ? [...(tagIds as string[]), ...combinedPending]
      : combinedPending.length > 0 ? combinedPending : undefined;

    if (data.slug) {
      const slugConflict = await prisma.story.findFirst({
        where: { slug: data.slug as string, NOT: { id } },
        select: { id: true },
      });
      if (slugConflict) {
        return NextResponse.json({ error: "That slug is already in use by another story." }, { status: 409 });
      }
    }

    const prev = await prisma.story.findUnique({ where: { id }, select: { slug: true, published: true, status: true, author: { select: { slug: true } } } });

    // Don't silently overwrite "pending" or "rejected" with "draft" when admin just edits content
    const resolvedStatusUpdate =
      statusUpdate.status === "draft" && (prev?.status === "pending" || prev?.status === "rejected")
        ? { status: prev.status }
        : statusUpdate;

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...data,
        ...resolvedStatusUpdate,
        ...(categoryIds !== undefined && {
          categories: { set: (categoryIds as string[]).map((cid) => ({ id: cid })) },
        }),
        ...(allTagIds !== undefined && {
          storyTags: { set: (allTagIds as string[]).map((tid) => ({ id: tid })) },
        }),
      },
      include: { author: { select: { name: true, slug: true } } },
    });
    if (story.published) submitToIndexNow([storyUrl(story.slug)]);
    // Only notify on unpublished → published transition
    if (!prev?.published && story.published) {
      pushToAll({
        title: story.seriesId ? `New chapter: ${story.title}` : `New story: ${story.title}`,
        body: `${story.author.name} just published on LustPages`,
        url: `/stories/${story.slug}`,
      }).catch(console.error);
    }
    // Bust story page cache:
    // - If still published: revalidate the (possibly new) slug
    // - If just unpublished (was published → now not): revalidate the old slug so the cached page clears
    // - If slug changed: also revalidate the old slug so it stops serving stale content
    const authorSlug = story.author.slug;
    if (story.published) {
      revalidateStory(story.slug, authorSlug);
    } else if (prev?.published) {
      revalidateStory(prev.slug, prev.author?.slug ?? authorSlug);
    }
    if (prev?.published && data.slug && prev.slug !== data.slug) {
      revalidateStory(prev.slug, prev.author?.slug ?? authorSlug);
    }
    return NextResponse.json(story);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const deleted = await prisma.story.findUnique({
      where: { id },
      select: { slug: true, published: true, author: { select: { slug: true } } },
    });
    await prisma.story.delete({ where: { id } });
    if (deleted?.published) revalidateStory(deleted.slug, deleted.author.slug);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
