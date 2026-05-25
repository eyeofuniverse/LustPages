import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STORY_COST = 5;
const SERIES_COST = 10;
const MAX_ACTIVE = 10;
const MAX_QUEUE = 10;
const DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, storyId, seriesId } = body as {
    type: "story" | "series";
    storyId?: string;
    seriesId?: string;
  };

  if (type !== "story" && type !== "series") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (type === "story" && !storyId) {
    return NextResponse.json({ error: "storyId required" }, { status: 400 });
  }
  if (type === "series" && !seriesId) {
    return NextResponse.json({ error: "seriesId required" }, { status: 400 });
  }

  const cost = type === "series" ? SERIES_COST : STORY_COST;

  const author = await prisma.author.findUnique({ where: { userId: session.user.id } });
  if (!author) {
    return NextResponse.json({ error: "Not an author account" }, { status: 403 });
  }

  if (type === "story") {
    const story = await prisma.story.findFirst({
      where: { id: storyId, authorId: author.id, published: true },
    });
    if (!story) {
      return NextResponse.json({ error: "Story not found or not published" }, { status: 404 });
    }
  } else {
    const series = await prisma.series.findFirst({ where: { id: seriesId, authorId: author.id } });
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
  }

  const existing = await prisma.featuredPromotion.findFirst({
    where: {
      type,
      ...(type === "story" ? { storyId } : { seriesId }),
      status: { in: ["active", "queued"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "active" ? "Already featured" : "Already in queue" },
      { status: 409 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true },
  });
  if (!user || user.coinBalance < cost) {
    return NextResponse.json({ error: "Insufficient coin balance" }, { status: 402 });
  }

  const now = new Date();
  await prisma.featuredPromotion.updateMany({
    where: { type, status: "active", expiresAt: { lt: now } },
    data: { status: "expired" },
  });

  const activeCount = await prisma.featuredPromotion.count({ where: { type, status: "active" } });

  if (activeCount >= MAX_ACTIVE) {
    const queueCount = await prisma.featuredPromotion.count({ where: { type, status: "queued" } });
    if (queueCount >= MAX_QUEUE) {
      return NextResponse.json(
        { error: "Featured queue is full. Please try again later." },
        { status: 503 }
      );
    }
  }

  const slotAvailable = activeCount < MAX_ACTIVE;
  const newStatus = slotAvailable ? "active" : "queued";
  const startedAt = slotAvailable ? now : null;
  const expiresAt = slotAvailable ? new Date(now.getTime() + DURATION_MS) : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coinBalance: { decrement: cost } },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -cost,
        type: "feature_promotion",
        description: `Featured ${type} promotion (7 days)`,
        ...(type === "story" && { storyId }),
      },
    }),
    prisma.featuredPromotion.create({
      data: {
        type,
        authorId: author.id,
        ...(type === "story" ? { storyId } : { seriesId }),
        coinsSpent: cost,
        status: newStatus,
        startedAt,
        expiresAt,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    status: newStatus,
    message:
      newStatus === "active"
        ? "Your promotion is now live for 7 days!"
        : "Added to the queue. You'll go live when a slot opens.",
  });
}
