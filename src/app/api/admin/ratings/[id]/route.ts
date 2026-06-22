import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const rating = await prisma.rating.findUnique({ where: { id }, select: { storyId: true } });
  if (!rating) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rating.delete({ where: { id } });

  const agg = await prisma.rating.aggregate({
    where: { storyId: rating.storyId },
    _avg: { value: true },
    _count: { value: true },
  });
  await prisma.story.update({
    where: { id: rating.storyId },
    data: {
      ratingAvg: agg._avg.value ?? 0,
      ratingCount: agg._count.value,
    },
  });

  return NextResponse.json({ ok: true });
}
