import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  const payment = await prisma.cryptoPayment.findFirst({
    where: { nowPaymentId: paymentId, userId: session.user.id },
    select: { status: true, totalCoins: true, creditedAt: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let balance: number | null = null;
  if (payment.status === "finished") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coinBalance: true },
    });
    balance = user?.coinBalance ?? null;
  }

  return NextResponse.json({ status: payment.status, totalCoins: payment.totalCoins, balance });
}
