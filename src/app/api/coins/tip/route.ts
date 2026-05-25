import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const AUTHOR_SHARE_PCT = 0.8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { authorId, storyId, amount, message } = await req.json();
  if (!authorId || !amount || typeof amount !== "number" || amount < 1) {
    return NextResponse.json({ error: "Invalid tip data" }, { status: 400 });
  }

  const author = await prisma.author.findUnique({ where: { id: authorId } });
  if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

  // Prevent tipping yourself
  if (author.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot tip yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true },
  });
  if (!user || user.coinBalance < amount) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 402 });
  }

  const authorShare = Math.floor(amount * AUTHOR_SHARE_PCT);
  const platformShare = amount - authorShare;

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coinBalance: { decrement: amount } },
    }),
    prisma.author.update({
      where: { id: authorId },
      data: { coinEarnings: { increment: authorShare } },
    }),
    prisma.tip.create({
      data: {
        fromUserId: session.user.id,
        toAuthorId: authorId,
        storyId: storyId ?? null,
        amount,
        authorShare,
        platformShare,
        message: message ?? null,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -amount,
        type: "tip_sent",
        description: `Tip to ${author.name}`,
        storyId: storyId ?? null,
      },
    }),
  ]);

  return NextResponse.json({ success: true, balance: updatedUser.coinBalance });
}
