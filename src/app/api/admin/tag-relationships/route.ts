import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { parentId, childId } = await req.json();
  if (!parentId || !childId) return NextResponse.json({ error: "parentId and childId are required" }, { status: 400 });
  if (parentId === childId) return NextResponse.json({ error: "A tag cannot be its own parent" }, { status: 400 });

  try {
    const rel = await prisma.tagRelationship.create({
      data: { parentId, childId },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        child: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(rel, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "That relationship already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    console.error("POST /api/admin/tag-relationships", e);
    return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
  }
}
