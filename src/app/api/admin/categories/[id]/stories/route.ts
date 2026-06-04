import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const [allStories, categoryRecord] = await Promise.all([
    prisma.story.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.category.findUnique({
      where: { id },
      select: { stories: { select: { id: true } } },
    }),
  ]);

  const inCategoryIds = new Set(categoryRecord?.stories.map((s) => s.id) ?? []);

  return NextResponse.json(
    allStories.map((s) => ({ id: s.id, title: s.title, inCategory: inCategoryIds.has(s.id) }))
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { add = [], remove = [] } = await req.json();

  await prisma.category.update({
    where: { id },
    data: {
      stories: {
        connect: (add as string[]).map((sid) => ({ id: sid })),
        disconnect: (remove as string[]).map((sid) => ({ id: sid })),
      },
    },
  });

  const updated = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { stories: true } } },
  });

  return NextResponse.json({ ok: true, category: updated });
}
