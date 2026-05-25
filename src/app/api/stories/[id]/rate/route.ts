import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function recalcRating(storyId: string) {
  const agg = await prisma.rating.aggregate({
    where: { storyId },
    _avg: { value: true },
    _count: { value: true },
  });
  const avg = agg._avg.value ?? 0;
  await prisma.story.update({
    where: { id: storyId },
    data: {
      ratingAvg: Math.round(avg * 10) / 10,
      ratingCount: agg._count.value,
    },
  });
  return { avgRating: Math.round(avg * 10) / 10, ratingCount: agg._count.value };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to rate stories" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const { value } = await req.json();

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  await prisma.rating.upsert({
    where: { userId_storyId: { userId: session.user.id, storyId } },
    create: { userId: session.user.id, storyId, value },
    update: { value, updatedAt: new Date() },
  });
  const { avgRating, ratingCount } = await recalcRating(storyId);
  return NextResponse.json({ rating: value, avgRating, ratingCount });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to rate stories" }, { status: 401 });
  }

  const { id: storyId } = await params;
  await prisma.rating.deleteMany({ where: { userId: session.user.id, storyId } });

  const { avgRating, ratingCount } = await recalcRating(storyId);
  return NextResponse.json({ ok: true, avgRating, ratingCount });
}
