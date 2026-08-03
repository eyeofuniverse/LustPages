import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { awardBadgesAsync } from "@/lib/badge-checker";

const AUTHOR_SHARE = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { seriesId } = await req.json();
  if (!seriesId) {
    return NextResponse.json({ error: "seriesId required" }, { status: 400 });
  }

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      name: true,
      isPremium: true,
      coinPrice: true,
      authorId: true,
      stories: { where: { published: true }, select: { id: true }, take: 1 },
    },
  });
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
  if (!series.isPremium || !series.coinPrice) {
    return NextResponse.json({ error: "Series is not premium" }, { status: 400 });
  }

  // Fast path: already unlocked (avoids a full transaction on the common case)
  const existing = await prisma.seriesUnlock.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  const authorShare = Math.floor(series.coinPrice * AUTHOR_SHARE);

  try {
    const newBalance = await prisma.$transaction(async (tx) => {
      // Atomically check and deduct — if balance was insufficient at commit time, count === 0
      const deducted = await tx.user.updateMany({
        where: { id: userId, coinBalance: { gte: series.coinPrice! } },
        data: { coinBalance: { decrement: series.coinPrice! } },
      });
      if (deducted.count === 0) throw new Error("INSUFFICIENT_COINS");

      await tx.seriesUnlock.create({
        data: { userId, seriesId, coinsSpent: series.coinPrice! },
      });
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -series.coinPrice!,
          type: "unlock",
          description: `Unlocked series: ${series.name}`,
        },
      });
      await tx.author.update({
        where: { id: series.authorId },
        data: { coinEarnings: { increment: authorShare } },
      });

      const updated = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
      return updated!.coinBalance;
    });

    awardBadgesAsync({ type: "UNLOCK", userId });
    return NextResponse.json({ success: true, balance: newBalance });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_COINS") {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 402 });
    }
    // Concurrent double-unlock hit the unique constraint — treat as already unlocked
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ success: true, alreadyUnlocked: true });
    }
    throw e;
  }
}
