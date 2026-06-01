import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const AUTHOR_SHARE = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { storyId } = await req.json();
  if (!storyId) {
    return NextResponse.json({ error: "storyId required" }, { status: 400 });
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId, published: true },
    select: { id: true, title: true, coinPrice: true, authorId: true },
  });
  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });
  if (!story.coinPrice) return NextResponse.json({ error: "Story is free" }, { status: 400 });

  // Fast path: already unlocked (avoids a full transaction on the common case)
  const existing = await prisma.storyUnlock.findUnique({
    where: { userId_storyId: { userId, storyId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  const authorShare = Math.floor(story.coinPrice * AUTHOR_SHARE);

  try {
    const newBalance = await prisma.$transaction(async (tx) => {
      // Atomically check and deduct — if balance was insufficient at commit time, count === 0
      const deducted = await tx.user.updateMany({
        where: { id: userId, coinBalance: { gte: story.coinPrice! } },
        data: { coinBalance: { decrement: story.coinPrice! } },
      });
      if (deducted.count === 0) throw new Error("INSUFFICIENT_COINS");

      await tx.storyUnlock.create({
        data: { userId, storyId, coinsSpent: story.coinPrice! },
      });
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -story.coinPrice!,
          type: "unlock",
          description: `Unlocked story: ${story.title}`,
          storyId,
        },
      });
      await tx.author.update({
        where: { id: story.authorId },
        data: { coinEarnings: { increment: authorShare } },
      });

      const updated = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
      return updated!.coinBalance;
    });

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
