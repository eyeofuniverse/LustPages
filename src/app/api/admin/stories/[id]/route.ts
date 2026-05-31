import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tag-helpers";

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
      "published" in data ? { status: data.published ? "approved" : "draft" } : {};
    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const allTagIds = tagIds !== undefined
      ? [...(tagIds as string[]), ...pendingTagIds]
      : pendingTagIds.length > 0 ? pendingTagIds : undefined;
    const story = await prisma.story.update({
      where: { id },
      data: {
        ...data,
        ...statusUpdate,
        ...(categoryIds !== undefined && {
          categories: { set: (categoryIds as string[]).map((cid) => ({ id: cid })) },
        }),
        ...(allTagIds !== undefined && {
          storyTags: { set: (allTagIds as string[]).map((tid) => ({ id: tid })) },
        }),
      },
    });
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
