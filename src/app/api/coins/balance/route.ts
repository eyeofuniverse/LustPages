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

  return NextResponse.json({
    balance: user?.coinBalance ?? 0,
    subscription: user?.subscription ?? null,
  });
}
