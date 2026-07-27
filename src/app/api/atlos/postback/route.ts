import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAtlosSignature } from "@/lib/atlos";
import { getTier } from "@/lib/subscription-tiers";

// Must read raw body before JSON.parse — HMAC is over the raw bytes
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("Signature");

  if (!verifyAtlosSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    TransactionId: string;
    SubscriptionId?: string;
    OrderId: string;
    Status: number;
    PaidAmount: number;
    OrderAmount: number;
    OrderCurrency: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process successful payments
  if (payload.Status !== 100) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const payment = await prisma.atlosPayment.findUnique({
    where: { orderId: payload.OrderId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Unknown orderId" }, { status: 404 });
  }

  // Idempotency — ignore duplicate postbacks
  if (payment.status === "completed") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const tier = getTier(payment.tier);
  if (!tier) {
    return NextResponse.json({ error: "Unknown tier" }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingSub = await prisma.subscription.findUnique({
    where: { userId: payment.userId },
    include: { user: { select: { coinBalance: true } } },
  });

  await prisma.$transaction(async (tx) => {
    // Mark payment complete
    await tx.atlosPayment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        transactionId: payload.TransactionId,
        atlosSubId: payload.SubscriptionId ?? null,
        creditedAt: now,
      },
    });

    if (existingSub) {
      // Renewal or tier change — expire leftover coins then grant fresh allocation
      const leftover = Math.min(existingSub.user?.coinBalance ?? 0, existingSub.subscriptionCoins);
      await tx.user.update({
        where: { id: payment.userId },
        data: { coinBalance: { decrement: leftover } },
      });
      if (leftover > 0) {
        await tx.coinTransaction.create({
          data: {
            userId: payment.userId,
            amount: -leftover,
            type: "expired",
            description: "Subscription coins expired on renewal",
          },
        });
      }
      await tx.subscription.update({
        where: { userId: payment.userId },
        data: {
          tier: payment.tier,
          status: "active",
          coinsPerMonth: tier.coinsPerMonth,
          subscriptionCoins: payment.coinsGranted,
          autoRenew: payment.autoRenew,
          atlosOrderId: payment.orderId,
          atlosSubscriptionId: payload.SubscriptionId ?? existingSub.atlosSubscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      // Brand-new subscription
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          tier: payment.tier,
          status: "active",
          coinsPerMonth: tier.coinsPerMonth,
          subscriptionCoins: payment.coinsGranted,
          autoRenew: payment.autoRenew,
          atlosOrderId: payment.orderId,
          atlosSubscriptionId: payload.SubscriptionId ?? null,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Credit coins
    await tx.user.update({
      where: { id: payment.userId },
      data: { coinBalance: { increment: payment.coinsGranted } },
    });

    await tx.coinTransaction.create({
      data: {
        userId: payment.userId,
        amount: payment.coinsGranted,
        type: "subscription_grant",
        description: `${tier.name} subscription — ${payment.coinsGranted} coins${payment.autoRenew ? " (auto-renew bonus included)" : ""}`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
