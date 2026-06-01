import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "admin" ? session : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const packages = await prisma.coinPackage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(packages);
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, description, coins, bonusCoins, price, subscriberDiscount, isActive, order } = await req.json();
  if (!name || !coins || !price) {
    return NextResponse.json({ error: "name, coins, and price are required" }, { status: 400 });
  }
  if (Number(price) <= 0) {
    return NextResponse.json({ error: "price must be greater than 0" }, { status: 400 });
  }
  if (Number(coins) <= 0) {
    return NextResponse.json({ error: "coins must be greater than 0" }, { status: 400 });
  }
  const pkg = await prisma.coinPackage.create({
    data: {
      name,
      description: description ?? null,
      coins: Number(coins),
      bonusCoins: Number(bonusCoins ?? 0),
      price: Number(price),
      subscriberDiscount: Number(subscriberDiscount ?? 0),
      isActive: isActive !== false,
      order: Number(order ?? 0),
    },
  });
  return NextResponse.json(pkg, { status: 201 });
}
