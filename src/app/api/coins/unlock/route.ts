import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const AUTHOR_SHARE = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const existing = await prisma.storyUnlock.findUnique({
    where: { userId_storyId: { userId: session.user.id, storyId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true },
  });
  if (!user || user.coinBalance < story.coinPrice) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 402 });
  }

  const authorShare = Math.floor(story.coinPrice * AUTHOR_SHARE);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coinBalance: { decrement: story.coinPrice } },
    }),
    prisma.storyUnlock.create({
      data: { userId: session.user.id, storyId, coinsSpent: story.coinPrice },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -story.coinPrice,
        type: "unlock",
        description: `Unlocked story: ${story.title}`,
        storyId,
      },
    }),
    prisma.author.update({
      where: { id: story.authorId },
      data: { coinEarnings: { increment: authorShare } },
    }),
  ]);

  return NextResponse.json({ success: true, balance: updatedUser.coinBalance });
}
