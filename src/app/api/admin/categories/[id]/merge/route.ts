import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { targetId } = await req.json();

  if (!targetId || targetId === id) {
    return NextResponse.json({ error: "Invalid target category." }, { status: 400 });
  }

  try {
    const source = await prisma.category.findUnique({
      where: { id },
      include: { stories: { select: { id: true } } },
    });
    if (!source) return NextResponse.json({ error: "Source category not found." }, { status: 404 });

    const targetExists = await prisma.category.findUnique({ where: { id: targetId } });
    if (!targetExists) return NextResponse.json({ error: "Target category not found." }, { status: 404 });

    if (source.stories.length > 0) {
      await prisma.category.update({
        where: { id: targetId },
        data: { stories: { connect: source.stories.map((s) => ({ id: s.id })) } },
      });
    }

    await prisma.category.delete({ where: { id } });

    const updated = await prisma.category.findUnique({
      where: { id: targetId },
      include: { _count: { select: { stories: true } } },
    });

    return NextResponse.json({ ok: true, category: updated, movedCount: source.stories.length });
  } catch (e) {
    console.error("[categories/merge]", e);
    return NextResponse.json({ error: "Merge failed." }, { status: 500 });
  }
}
