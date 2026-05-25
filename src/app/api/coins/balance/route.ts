import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ balance: 0, subscription: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true, subscription: true },
  });

  const sub = user?.subscription ?? null;

  // Auto-renewal for demo mode: if active subscription period has ended, grant next month's coins
  if (sub && sub.status === "active" && sub.currentPeriodEnd < new Date()) {
    const now = new Date();
    const nextPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.subscription.update({
        where: { userId: session.user.id },
        data: { currentPeriodStart: now, currentPeriodEnd: nextPeriodEnd },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { coinBalance: { increment: sub.coinsPerMonth } },
      }),
      prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          amount: sub.coinsPerMonth,
          type: "subscription_grant",
          description: `Monthly renewal — ${sub.coinsPerMonth} coins`,
        },
      }),
    ]);

    const refreshed = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coinBalance: true, subscription: true },
    });

    return NextResponse.json({
      balance: refreshed?.coinBalance ?? 0,
      subscription: refreshed?.subscription ?? null,
    });
  }

  // If cancelled subscription period has ended, mark expired
  if (sub && sub.status === "cancelled" && sub.currentPeriodEnd < new Date()) {
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { status: "expired" },
    });
  }

  return NextResponse.json({
    balance: user?.coinBalance ?? 0,
    subscription: sub,
  });
}
