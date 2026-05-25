import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { from, to } = (await req.json()) as { from: string; to: string };
  if (!from?.trim() || !to?.trim()) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  // Search using quoted form to avoid partial substring matches in the JSON array string
  const stories = await prisma.story.findMany({
    where: { tags: { contains: `"${from}"` } },
    select: { id: true, tags: true },
  });

  let updated = 0;
  for (const story of stories) {
    try {
      const tags = JSON.parse(story.tags) as string[];
      if (tags.includes(from)) {
        // Map and deduplicate in case the target tag already exists on the story
        const newTags = [...new Set(tags.map((t) => (t === from ? to.trim() : t)))];
        await prisma.story.update({ where: { id: story.id }, data: { tags: JSON.stringify(newTags) } });
        updated++;
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ updated });
}
