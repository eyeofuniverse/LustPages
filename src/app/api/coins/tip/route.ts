import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const AUTHOR_SHARE_PCT = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { authorId, storyId, amount, message } = await req.json();
  if (!authorId || !amount || typeof amount !== "number" || !Number.isInteger(amount) || amount < 10) {
    return NextResponse.json({ error: "Tip must be a whole number of at least 10 coins" }, { status: 400 });
  }

  const author = await prisma.author.findUnique({ where: { id: authorId } });
  if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

  if (author.userId === userId) {
    return NextResponse.json({ error: "Cannot tip yourself" }, { status: 400 });
  }

  const authorShare = Math.floor(amount * AUTHOR_SHARE_PCT);
  const platformShare = amount - authorShare;

  try {
    const newBalance = await prisma.$transaction(async (tx) => {
      // Atomically check and deduct — if balance was insufficient at commit time, count === 0
      const deducted = await tx.user.updateMany({
        where: { id: userId, coinBalance: { gte: amount } },
        data: { coinBalance: { decrement: amount } },
      });
      if (deducted.count === 0) throw new Error("INSUFFICIENT_COINS");

      await tx.author.update({
        where: { id: authorId },
        data: { coinEarnings: { increment: authorShare } },
      });
      await tx.tip.create({
        data: {
          fromUserId: userId,
          toAuthorId: authorId,
          storyId: storyId ?? null,
          amount,
          authorShare,
          platformShare,
          message: message ?? null,
        },
      });
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: "tip_sent",
          description: `Tip to ${author.name}`,
          storyId: storyId ?? null,
        },
      });

      const updated = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
      return updated!.coinBalance;
    });

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_COINS") {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 402 });
    }
    throw e;
  }
}
