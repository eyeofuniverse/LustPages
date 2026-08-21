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

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { categoryIds, tagIds, newTagNames, authorKeywords, ...data } = await req.json();
    if (data.content) data.content = sanitizeStoryContent(data.content);
    const pendingTagIds = await resolveNewTags(newTagNames ?? []);
    const keywordTagIds = await resolveNewTags(authorKeywords ?? [], true);
    const allTagIds = [...(Array.isArray(tagIds) ? tagIds as string[] : []), ...pendingTagIds, ...keywordTagIds];
    // Auto-deduplicate slug — append -2, -3, … rather than letting the DB throw
    if (data.slug) {
      const baseSlug = data.slug as string;
      let finalSlug = baseSlug;
      for (let i = 2; ; i++) {
        const existing = await prisma.story.findUnique({ where: { slug: finalSlug }, select: { id: true } });
        if (!existing) break;
        finalSlug = `${baseSlug}-${i}`;
      }
      data.slug = finalSlug;
    }

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
      include: { author: { select: { name: true } } },
    });
    if (story.published) {
      submitToIndexNow([storyUrl(story.slug)]);
      pushToAll({
        title: story.seriesId ? `New chapter: ${story.title}` : `New story: ${story.title}`,
        body: `${story.author.name} just published on LustPages`,
        url: `/stories/${story.slug}`,
      }).catch(console.error);
    }
    return NextResponse.json(story, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
