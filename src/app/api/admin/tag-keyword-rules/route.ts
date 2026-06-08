import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rules = await prisma.tagKeywordRule.findMany({
    include: { parentTag: { select: { id: true, name: true, slug: true } } },
    orderBy: { keyword: "asc" },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { keyword, parentTagId } = await req.json();
  if (!keyword?.trim()) return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  if (!parentTagId) return NextResponse.json({ error: "parentTagId is required" }, { status: 400 });

  const kw = keyword.trim().toLowerCase();

  try {
    const rule = await prisma.tagKeywordRule.create({
      data: { keyword: kw, parentTagId },
      include: { parentTag: { select: { id: true, name: true, slug: true } } },
    });

    // Retroactively apply to all existing approved tags that match
    const matchingTags = await prisma.tag.findMany({
      where: { isApproved: true, name: { contains: kw, mode: "insensitive" } },
      select: { id: true, name: true },
    });

    let applied = 0;
    for (const tag of matchingTags) {
      if (tag.id === parentTagId) continue;
      await prisma.tagRelationship.upsert({
        where: { parentId_childId: { parentId: parentTagId, childId: tag.id } },
        update: {},
        create: { parentId: parentTagId, childId: tag.id },
      });
      applied++;
    }

    return NextResponse.json({ rule, applied }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: `A rule for keyword "${kw}" already exists` }, { status: 409 });
    }
    console.error("POST /api/admin/tag-keyword-rules", e);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
