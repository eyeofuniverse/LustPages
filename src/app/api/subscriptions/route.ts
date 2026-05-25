import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/subscription-tiers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ subscription: null });

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ subscription: sub });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tierId } = await req.json();
  const tier = getTier(tierId);
  if (!tier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const existing = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (existing) {
    // Upgrade/downgrade: change tier, grant difference in coins if upgrading
    const oldTierDef = getTier(existing.tier);
    const coinDiff = tier.coinsPerMonth - (oldTierDef?.coinsPerMonth ?? 0);

    await prisma.$transaction([
      prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          tier: tier.id,
          status: "active",
          coinsPerMonth: tier.coinsPerMonth,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      }),
      ...(coinDiff > 0
        ? [
            prisma.user.update({
              where: { id: session.user.id },
              data: { coinBalance: { increment: coinDiff } },
            }),
            prisma.coinTransaction.create({
              data: {
                userId: session.user.id,
                amount: coinDiff,
                type: "subscription_grant",
                description: `Subscription upgrade to ${tier.name} — ${coinDiff} coins`,
              },
            }),
          ]
        : []),
    ]);
  } else {
    // New subscription — grant first month coins immediately
    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          userId: session.user.id,
          tier: tier.id,
          status: "active",
          coinsPerMonth: tier.coinsPerMonth,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { coinBalance: { increment: tier.coinsPerMonth } },
      }),
      prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          amount: tier.coinsPerMonth,
          type: "subscription_grant",
          description: `${tier.name} subscription — ${tier.coinsPerMonth} coins for this month`,
        },
      }),
    ]);
  }

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinBalance: true },
  });

  return NextResponse.json({ success: true, balance: updated?.coinBalance });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 404 });

  await prisma.subscription.update({
    where: { userId: session.user.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true });
}
