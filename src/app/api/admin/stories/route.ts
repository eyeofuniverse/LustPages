import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { resolveNewTags } from "@/lib/tag-helpers";
import { submitToIndexNow, storyUrl } from "@/lib/indexnow";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { categoryIds, tagIds, newTagNames, ...data } = await req.json();
    if (data.content) data.content = sanitizeStoryContent(data.content);
    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const allTagIds = [...(Array.isArray(tagIds) ? tagIds as string[] : []), ...pendingTagIds];
    const story = await prisma.story.create({
      data: {
        ...data,
        status: data.published || data.scheduledAt ? "approved" : "draft",
        categories: {
          connect: (categoryIds as string[]).map((id) => ({ id })),
        },
        ...(allTagIds.length > 0 && {
          storyTags: { connect: allTagIds.map((id) => ({ id })) },
        }),
      },
    });
    if (story.published) submitToIndexNow([storyUrl(story.slug)]);
    return NextResponse.json(story, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
