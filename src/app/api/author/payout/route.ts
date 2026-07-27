import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true, coinEarnings: true },
  });
  if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });
  if (author.coinEarnings < 100) {
    return NextResponse.json({ error: "Minimum payout is 100 coins ($1.00)" }, { status: 400 });
  }

  const { method, accountDetails } = await req.json();
  if (!method || !accountDetails) {
    return NextResponse.json({ error: "method and accountDetails are required" }, { status: 400 });
  }

  const VALID_METHODS = ["bank", "paypal", "crypto"];
  if (!VALID_METHODS.includes(method)) {
    return NextResponse.json({ error: "method must be bank, paypal, or crypto" }, { status: 400 });
  }

  const details = String(accountDetails).trim();
  let formatOk = false;
  let formatHint = "";
  if (method === "paypal") {
    formatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details);
    formatHint = "PayPal account must be a valid email address";
  } else if (method === "bank") {
    // IBAN / account number: 8–42 chars, alphanumeric + spaces/dashes
    formatOk = /^[A-Z0-9\s-]{8,42}$/i.test(details);
    formatHint = "Bank account must be 8–42 alphanumeric characters (IBAN or account number)";
  } else if (method === "crypto") {
    // Shortest real addresses are ~26 chars; allow alphanumeric + common prefixes
    formatOk = /^[A-Za-z0-9]{26,}$/.test(details);
    formatHint = "Crypto wallet address must be at least 26 alphanumeric characters";
  }
  if (!formatOk) {
    return NextResponse.json({ error: formatHint }, { status: 400 });
  }

  const usdAmount = parseFloat((author.coinEarnings / 100).toFixed(2));

  // Atomically zero earnings and write the payout ledger record
  const [, payout] = await prisma.$transaction([
    prisma.author.update({
      where: { id: author.id },
      data: { coinEarnings: 0 },
    }),
    prisma.payoutRequest.create({
      data: {
        authorId: author.id,
        coinsRequested: author.coinEarnings,
        usdAmount,
        method,
        accountDetails,
        status: "pending",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    payoutRequestId: payout.id,
    coinsRequested: author.coinEarnings,
    usdAmount: usdAmount.toFixed(2),
    message: "Payout request received. Earnings reset to 0. Processing within 7 business days.",
  });
}
