import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/subscription-tiers";
import { NextRequest, NextResponse } from "next/server";
import { createPayment, getMinAmount, type SupportedCurrency } from "@/lib/nowpayments";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { packageId?: string; payCurrency?: SupportedCurrency };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { packageId, payCurrency = "usdttrc20" } = body;

  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  if (pkg.price <= 0) {
    return NextResponse.json({ error: "Package price is invalid." }, { status: 422 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { tier: true, status: true },
  });

  const isActiveSubscriber = sub?.status === "active";
  const tierDef = isActiveSubscriber ? getTier(sub!.tier) : null;
  const discountPct = tierDef?.discount ?? 0;

  const baseTotal = pkg.coins + pkg.bonusCoins;
  const subscriberBonus = isActiveSubscriber ? Math.floor(baseTotal * discountPct) : 0;
  const totalCoins = baseTotal + subscriberBonus;

  // Validate against NOWPayments minimum before attempting to create
  try {
    const minAmount = await getMinAmount(payCurrency as SupportedCurrency);
    if (pkg.price < minAmount) {
      return NextResponse.json(
        { error: `Minimum payment for this currency is $${minAmount.toFixed(2)}. Choose a larger package or a different currency.` },
        { status: 422 }
      );
    }
  } catch {
    // Non-fatal — let NOWPayments reject it with its own error if the check fails
  }

  const orderId = `lp_${session.user.id}_${pkg.id}_${Date.now()}`;

  let payment;
  try {
    payment = await createPayment({
      priceUsd: pkg.price,
      payCurrency,
      orderId,
      orderDescription: `LustPages — ${pkg.name} (${totalCoins} coins)`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment gateway error";
    console.error("[purchase] createPayment failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    await prisma.cryptoPayment.create({
      data: {
        nowPaymentId: payment.payment_id,
        userId: session.user.id,
        packageId: pkg.id,
        packageName: pkg.name,
        totalCoins,
        subscriberBonus,
        amountUsd: pkg.price,
        payCurrency: payment.pay_currency,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        status: "waiting",
      },
    });
  } catch (err) {
    console.error("[purchase] prisma.cryptoPayment.create failed:", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return NextResponse.json({
    paymentId: payment.payment_id,
    payAddress: payment.pay_address,
    payAmount: payment.pay_amount,
    payCurrency: payment.pay_currency,
    amountUsd: pkg.price,
    totalCoins,
    expiresAt: payment.expiration_estimate_date ?? null,
    paymentUrl: payment.payment_url ?? null,
  });
}
