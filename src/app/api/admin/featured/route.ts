import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

// GET /api/admin/featured?type=story|series
export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const type = req.nextUrl.searchParams.get("type") as "story" | "series" | null;
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const [adminItems, paidPromos] = await Promise.all([
    prisma.adminFeaturedItem.findMany({
      where: { type },
      orderBy: { order: "asc" },
      include: {
        story: type === "story"
          ? { select: { id: true, title: true, slug: true, coverImage: true, author: { select: { name: true } } } }
          : false,
        series: type === "series"
          ? { select: { id: true, name: true, slug: true, coverImage: true, author: { select: { name: true } } } }
          : false,
      },
    }),
    prisma.featuredPromotion.findMany({
      where: { type, status: { in: ["active", "queued"] } },
      orderBy: [{ status: "asc" }, { startedAt: "asc" }],
      include: {
        story: type === "story"
          ? { select: { id: true, title: true, slug: true, author: { select: { name: true } } } }
          : false,
        series: type === "series"
          ? { select: { id: true, name: true, slug: true, author: { select: { name: true } } } }
          : false,
        author: { select: { name: true } },
      },
    }),
  ]);
  return NextResponse.json({ adminItems, paidPromos });
}

// POST /api/admin/featured — add an admin pick
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type, storyId, seriesId } = await req.json() as {
    type: "story" | "series";
    storyId?: string;
    seriesId?: string;
  };

  if (type === "story" && !storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });
  if (type === "series" && !seriesId) return NextResponse.json({ error: "seriesId required" }, { status: 400 });

  // Verify the story/series exists and is published
  if (type === "story") {
    const story = await prisma.story.findFirst({ where: { id: storyId, published: true } });
    if (!story) return NextResponse.json({ error: "Story not found or not published" }, { status: 404 });
  } else {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  // Get next order value
  const last = await prisma.adminFeaturedItem.findFirst({ where: { type }, orderBy: { order: "desc" } });
  const order = (last?.order ?? -1) + 1;

  try {
    const item = await prisma.adminFeaturedItem.create({
      data: {
        type,
        ...(type === "story" ? { storyId } : { seriesId }),
        order,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Already in admin featured" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE /api/admin/featured?id=xxx
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.adminFeaturedItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/admin/featured — expire a paid promotion manually
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json() as { id: string };
  await prisma.featuredPromotion.update({ where: { id }, data: { status: "expired" } });
  return NextResponse.json({ success: true });
}
