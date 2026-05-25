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

  // Demo mode — log the request and zero out earnings
  await prisma.author.update({
    where: { id: author.id },
    data: { coinEarnings: 0 },
  });

  return NextResponse.json({
    ok: true,
    coinsRequested: author.coinEarnings,
    usdAmount: (author.coinEarnings / 100).toFixed(2),
    message: "Payout request received (demo mode — no real transfer). Earnings reset to 0.",
  });
}
