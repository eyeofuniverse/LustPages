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

  const { tag } = (await req.json()) as { tag: string };
  if (!tag?.trim()) return NextResponse.json({ error: "tag is required" }, { status: 400 });

  const stories = await prisma.story.findMany({
    where: { tags: { contains: `"${tag}"` } },
    select: { id: true, tags: true },
  });

  let updated = 0;
  for (const story of stories) {
    try {
      const tags = JSON.parse(story.tags) as string[];
      if (tags.includes(tag)) {
        await prisma.story.update({
          where: { id: story.id },
          data: { tags: JSON.stringify(tags.filter((t) => t !== tag)) },
        });
        updated++;
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ updated });
}
