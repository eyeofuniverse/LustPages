import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const AUTHOR_SHARE = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const existing = await prisma.seriesUnlock.findUnique({
    where: { userId_seriesId: { userId: session.user.id, seriesId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true },
  });
  if (!user || user.coinBalance < series.coinPrice) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 402 });
  }

  const authorShare = Math.floor(series.coinPrice * AUTHOR_SHARE);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coinBalance: { decrement: series.coinPrice } },
    }),
    prisma.seriesUnlock.create({
      data: { userId: session.user.id, seriesId, coinsSpent: series.coinPrice },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -series.coinPrice,
        type: "unlock",
        description: `Unlocked series: ${series.name}`,
      },
    }),
    prisma.author.update({
      where: { id: series.authorId },
      data: { coinEarnings: { increment: authorShare } },
    }),
  ]);

  return NextResponse.json({ success: true, balance: updatedUser.coinBalance });
}
