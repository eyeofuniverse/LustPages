import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTier, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { ATLOS_MERCHANT_ID } from "@/lib/atlos";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier: tierId, autoRenew = true } = await req.json();
  const tier = getTier(tierId);
  if (!tier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const orderId = `atlos_${session.user.id}_${tierId}_${Date.now()}`;
  const coins = autoRenew ? tier.coinsAutoRenew : tier.coinsPerMonth;

  await prisma.atlosPayment.create({
    data: {
      userId: session.user.id,
      orderId,
      tier: tierId,
      amount: tier.price,
      autoRenew,
      coinsGranted: coins,
      status: "pending",
    },
  });

  return NextResponse.json({
    orderId,
    merchantId: ATLOS_MERCHANT_ID,
    orderAmount: tier.price,
    autoRenew,
    coins,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ tiers: SUBSCRIPTION_TIERS });

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      tier: true,
      status: true,
      autoRenew: true,
      subscriptionCoins: true,
      currentPeriodEnd: true,
    },
  });

  return NextResponse.json({ tiers: SUBSCRIPTION_TIERS, subscription: sub ?? null });
}
