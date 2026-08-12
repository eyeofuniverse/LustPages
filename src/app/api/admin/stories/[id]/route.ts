import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tags-db";
import { submitToIndexNow, storyUrl } from "@/lib/indexnow";
import { pushToAll } from "@/lib/onesignal";

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
    const { categoryIds, tagIds, newTagNames, ...data } = await req.json();
    if (data.content) data.content = sanitizeStoryContent(data.content);
    const statusUpdate =
      "published" in data || "scheduledAt" in data
        ? { status: data.published || data.scheduledAt ? "approved" : "draft" }
        : {};
    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const allTagIds = tagIds !== undefined
      ? [...(tagIds as string[]), ...pendingTagIds]
      : pendingTagIds.length > 0 ? pendingTagIds : undefined;

    const prev = await prisma.story.findUnique({ where: { id }, select: { published: true, status: true } });

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
      include: { author: { select: { name: true } } },
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
    await prisma.story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
