import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIpnSignature, FINISHED_STATUSES, FAILED_STATUSES } from "@/lib/nowpayments";
import { sendPurchaseInvoiceEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyIpnSignature(body, signature)) {
    console.error("[NOWPayments IPN] Invalid signature", { signature });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const nowPaymentId = String(body.payment_id ?? "");
  const status = String(body.payment_status ?? "");

  if (!nowPaymentId) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const payment = await prisma.cryptoPayment.findUnique({
    where: { nowPaymentId },
  });

  if (!payment) {
    console.error("[NOWPayments IPN] Unknown payment", nowPaymentId);
    return NextResponse.json({ ok: true }); // acknowledge to prevent retries
  }

  // Idempotency — already credited
  if (payment.creditedAt !== null) {
    return NextResponse.json({ ok: true });
  }

  if (FINISHED_STATUSES.has(status)) {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the payment by flipping creditedAt only while it is still null.
      // If a concurrent webhook already committed first, count === 0 and we skip crediting.
      const claimed = await tx.cryptoPayment.updateMany({
        where: { nowPaymentId, creditedAt: null },
        data: { status: "finished", creditedAt: new Date(), updatedAt: new Date() },
      });
      if (claimed.count === 0) return;

      const user = await tx.user.update({
        where: { id: payment.userId },
        data: { coinBalance: { increment: payment.totalCoins } },
        select: { email: true, name: true, coinBalance: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId: payment.userId,
          amount: payment.totalCoins,
          type: "purchase",
          description: payment.subscriberBonus > 0
            ? `Purchased ${payment.packageName} — ${payment.totalCoins - payment.subscriberBonus} coins + ${payment.subscriberBonus} subscriber bonus`
            : `Purchased ${payment.packageName} — ${payment.totalCoins} coins`,
          packageId: payment.packageId,
        },
      });

      sendPurchaseInvoiceEmail(user.email, user.name, {
        packageName: payment.packageName,
        coins: payment.totalCoins - payment.subscriberBonus,
        bonusCoins: payment.subscriberBonus,
        price: payment.amountUsd,
        newBalance: user.coinBalance,
      }).catch(console.error);
    });
  } else if (FAILED_STATUSES.has(status)) {
    await prisma.cryptoPayment.update({
      where: { nowPaymentId },
      data: { status, updatedAt: new Date() },
    });
  } else {
    await prisma.cryptoPayment.update({
      where: { nowPaymentId },
      data: { status, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
