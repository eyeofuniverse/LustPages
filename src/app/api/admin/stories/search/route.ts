import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const stories = await prisma.story.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    select: { id: true, title: true, slug: true, published: true },
    orderBy: [{ published: "desc" }, { title: "asc" }],
    take: 10,
  });

  return NextResponse.json(stories);
}
